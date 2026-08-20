"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendAssignmentEmails } from "@/lib/assignment-email";

export async function saveTrainingAssignments(formData:FormData) {
  const [contentType,contentId]=String(formData.get("content")??"").split(":");
  const companyIds=formData.getAll("companyIds").map(String).filter(Boolean);
  const manufacturerTeam=formData.get("manufacturerTeam")==="on";
  const required=formData.get("required")==="on";
  const dueDate=String(formData.get("dueDate")??"");
  const dueAt=dueDate?new Date(`${dueDate}T23:59:59`).toISOString():null;
  const notify=formData.get("notify")==="on";
  if(!["quiz","course"].includes(contentType)||!contentId) redirect("/app/assignments?error=Choose+training+content.");
  if(!manufacturerTeam&&!companyIds.length) redirect("/app/assignments?error=Choose+the+manufacturer+team+or+at+least+one+retailer.");
  const supabase=await createSupabaseServerClient();
  if(manufacturerTeam){
    const {error}=contentType==="quiz"?await supabase.rpc("assign_quiz_to_internal_team",{target_quiz_id:contentId,required,target_due_at:dueAt}):await supabase.rpc("assign_course_to_internal_team",{target_course_id:contentId,required,target_due_at:dueAt});
    if(error)redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  }
  for(const companyId of companyIds){
    const {error}=contentType==="quiz"?await supabase.rpc("upsert_manufacturer_assignment",{target_company_id:companyId,target_quiz_id:contentId,required,target_due_at:dueAt}):await supabase.rpc("assign_manufacturer_course",{target_company_id:companyId,target_course_id:contentId,required,target_due_at:dueAt});
    if(error)redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  }
  const delivery=notify?await sendAssignmentEmails(supabase,{contentType,contentId,companyIds,manufacturerTeam,required,dueAt}):null;
  revalidatePath("/app/assignments");revalidatePath("/app");revalidatePath("/app/courses");revalidatePath("/app/my-training");
  redirect(`/app/assignments?saved=${companyIds.length+(manufacturerTeam?1:0)}${delivery&&!delivery.disabled?`&notified=${delivery.sent}&emailFailed=${delivery.failed}`:""}`);
}

function assignmentTarget(formData:FormData) {
  return {
    target_audience_type:String(formData.get("audienceType")??""),
    target_audience_id:String(formData.get("audienceId")??"")||null,
    target_content_type:String(formData.get("contentType")??""),
    target_content_id:String(formData.get("contentId")??""),
  };
}

export async function updateAssignment(formData:FormData) {
  const supabase=await createSupabaseServerClient();
  const dueDate=String(formData.get("dueDate")??"");
  const {error}=await supabase.rpc("update_training_assignment",{
    ...assignmentTarget(formData),
    required:formData.get("required")==="on",
    target_due_at:dueDate?new Date(`${dueDate}T23:59:59`).toISOString():null,
  });
  if(error)redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/assignments");revalidatePath("/app");revalidatePath("/app/my-training");
  redirect("/app/assignments?updated=1");
}

export async function removeAssignment(formData:FormData) {
  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.rpc("remove_training_assignment",assignmentTarget(formData));
  if(error)redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/assignments");revalidatePath("/app");revalidatePath("/app/my-training");revalidatePath("/app/retailers");
  redirect("/app/assignments?removed=1");
}

export async function bulkRemoveAssignments(formData:FormData) {
  const keys=formData.getAll("assignmentKeys").map(String);
  if(!keys.length)redirect("/app/assignments?error=Choose+at+least+one+assignment.");
  const targets=keys.map(target=>{const [audienceType,audienceId,contentType,contentId]=target.split(":");return {audienceType,audienceId,contentType,contentId};});
  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.rpc("remove_training_assignments",{targets});
  if(error)redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/assignments");revalidatePath("/app");revalidatePath("/app/my-training");revalidatePath("/app/retailers");
  redirect(`/app/assignments?removed=${targets.length}`);
}
