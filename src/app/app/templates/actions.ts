"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const cleanPath=(value:FormDataEntryValue|null)=>{const path=String(value??"/app/templates");return path==="/app"||path.startsWith("/app/")?path:"/app/templates"};

export async function saveContentTemplate(formData:FormData){
  const returnTo=cleanPath(formData.get("returnTo"));
  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.rpc("save_content_as_template",{
    content_type:String(formData.get("contentType")??""),target_content_id:String(formData.get("contentId")??""),
    template_name:String(formData.get("templateName")??"").trim(),template_description:String(formData.get("templateDescription")??"").trim()||null,make_platform:false,
  });
  if(error)redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?templateSaved=1`);
}

export async function useContentTemplate(formData:FormData){
  const supabase=await createSupabaseServerClient();
  const type=String(formData.get("contentType")??"");
  const {data,error}=await supabase.rpc("use_content_template",{target_template_id:String(formData.get("templateId")??"")});
  if(error)redirect(`/app/templates?error=${encodeURIComponent(error.message)}`);
  const section=type==="product"?"products":type==="quiz"?"quizzes":"courses";
  redirect(`/app/${section}/${data}/edit?fromTemplate=1`);
}

export async function deleteContentTemplate(formData:FormData){
  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.rpc("delete_content_template",{target_template_id:String(formData.get("templateId")??"")});
  if(error)redirect(`/app/templates?error=${encodeURIComponent(error.message)}`);
  redirect("/app/templates?deleted=1");
}
