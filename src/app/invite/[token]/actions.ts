"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createInvitedAccount(formData: FormData) {
  const token=String(formData.get("token")??""); const password=String(formData.get("password")??""); const supabase=await createSupabaseServerClient();
  const {data:details}=await supabase.rpc("get_invitation_details",{invitation_token:token}); const invite=details as {email:string;status:string}|null;
  if(!invite||invite.status!=="pending") redirect(`/invite/${token}?error=This+invitation+is+no+longer+available.`);
  const origin=(await headers()).get("origin")||"http://localhost:3000";
  const {data,error}=await supabase.auth.signUp({email:invite.email,password,options:{emailRedirectTo:`${origin}/auth/callback?next=${encodeURIComponent(`/invite/${token}/accept`)}`}});
  if(error) redirect(`/invite/${token}?error=${encodeURIComponent(error.message)}`);
  if(data.session){const {error:acceptError}=await supabase.rpc("accept_training_invitation",{invitation_token:token});if(acceptError) redirect(`/invite/${token}?error=${encodeURIComponent(acceptError.message)}`);redirect("/app");}
  redirect(`/invite/${token}?checkEmail=1`);
}
