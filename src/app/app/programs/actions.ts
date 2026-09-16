"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message:string):never => redirect(`/app/programs?error=${encodeURIComponent(message)}`);
const timestamp = (value:FormDataEntryValue|null) => {
  const raw=String(value??"").trim();
  if(!raw)return null;
  const date=new Date(raw);
  return Number.isNaN(date.getTime())?null:date.toISOString();
};

export async function saveDealerProgram(formData:FormData){
  const supabase=await createSupabaseServerClient();
  const[{data:auth},brand]=await Promise.all([supabase.auth.getUser(),getActiveBrand()]);
  if(!auth.user)redirect("/login");
  if(!brand?.can_manage_training)redirect("/app");

  const existingId=String(formData.get("programId")??"").trim()||null;
  const programId=existingId??randomUUID();
  const title=String(formData.get("title")??"").trim();
  const summary=String(formData.get("summary")??"").trim();
  const details=String(formData.get("offerDetails")??"").trim();
  const audienceMode=formData.get("audienceMode")==="selected"?"selected":"all";
  const status=formData.get("intent")==="publish"?"active":"draft";
  const companyIds=formData.getAll("companyIds").map(String);
  const productIds=formData.getAll("productIds").map(String);
  if(title.length<3||title.length>160)fail("Offer title must be between 3 and 160 characters.");
  if(summary.length<10||summary.length>600)fail("Add a concise program summary between 10 and 600 characters.");
  if(details.length<10||details.length>5000)fail("Add the complete offer details before saving.");
  if(audienceMode==="selected"&&!companyIds.length)fail("Choose at least one eligible retailer.");

  let existingFlyer:string|null=null;
  if(existingId){const{data}=await supabase.from("dealer_programs").select("flyer_path").eq("id",existingId).single();existingFlyer=data?.flyer_path??null;}
  let flyerPath=existingFlyer;
  let uploadedPath:string|null=null;
  const flyer=formData.get("flyer");
  if(flyer instanceof File&&flyer.size>0){
    if(flyer.type!=="application/pdf")fail("The dealer flyer must be a PDF.");
    if(flyer.size>10*1024*1024)fail("The dealer flyer must be smaller than 10 MB.");
    uploadedPath=`${brand.id}/${programId}/flyer-${Date.now()}.pdf`;
    const{error}=await supabase.storage.from("dealer-programs").upload(uploadedPath,flyer,{contentType:"application/pdf"});
    if(error)fail(error.message);
    flyerPath=uploadedPath;
  }

  const{error}=await supabase.rpc("save_dealer_program",{
    target_program_id:existingId,program_title:title,program_summary:summary,program_offer_details:details,
    program_eligibility:String(formData.get("eligibility")??""),program_terms:String(formData.get("terms")??""),program_flyer_path:flyerPath??"",
    program_contact_name:String(formData.get("contactName")??""),program_contact_email:String(formData.get("contactEmail")??""),program_contact_phone:String(formData.get("contactPhone")??""),
    program_cta_label:String(formData.get("ctaLabel")??"I'm interested"),program_starts_at:timestamp(formData.get("startsAt")),program_ends_at:timestamp(formData.get("endsAt")),
    program_status:status,program_audience_mode:audienceMode,target_company_ids:companyIds,related_product_ids:productIds,
  });
  if(error){if(uploadedPath)await supabase.storage.from("dealer-programs").remove([uploadedPath]);fail(error.message);}
  if(uploadedPath&&existingFlyer&&existingFlyer!==uploadedPath)await supabase.storage.from("dealer-programs").remove([existingFlyer]);
  revalidatePath("/app/programs");revalidatePath("/app/dealer-programs");
  redirect(`/app/programs?saved=1${status==="active"?"&published=1":""}`);
}

export async function archiveDealerProgram(formData:FormData){
  const supabase=await createSupabaseServerClient();
  const{error}=await supabase.from("dealer_programs").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",String(formData.get("programId")??""));
  if(error)fail(error.message);
  revalidatePath("/app/programs");revalidatePath("/app/dealer-programs");
  redirect("/app/programs?archived=1");
}
