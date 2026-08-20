"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData:FormData){
  const email=String(formData.get("email")??"").trim();const brand=String(formData.get("brand")??"");
  const site=(process.env.NEXT_PUBLIC_SITE_URL?.trim()||"http://localhost:3000").replace(/\/$/,"");
  const supabase=await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${site}/reset-password${brand?`?brand=${encodeURIComponent(brand)}`:""}`});
  redirect(`/forgot-password?sent=1${brand?`&brand=${encodeURIComponent(brand)}`:""}`);
}
