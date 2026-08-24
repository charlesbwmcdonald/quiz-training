"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function expressProgramInterest(formData:FormData){
  const programId=String(formData.get("programId")??"");
  const supabase=await createSupabaseServerClient();
  const{error}=await supabase.rpc("record_dealer_program_event",{target_program_id:programId,target_event_type:"interest"});
  if(error)redirect(`/app/dealer-programs/${programId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/app/dealer-programs/${programId}`);
  redirect(`/app/dealer-programs/${programId}?interested=1`);
}

export async function recordProgramView(programId:string){
  const supabase=await createSupabaseServerClient();
  await supabase.rpc("record_dealer_program_event",{target_program_id:programId,target_event_type:"view"});
}
