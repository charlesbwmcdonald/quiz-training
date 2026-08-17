"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function switchAcademy(formData:FormData) {
  const academyId=String(formData.get("academyId")??"");
  const supabase=await createSupabaseServerClient();
  const {data:slug,error}=await supabase.rpc("select_academy",{target_manufacturer_id:academyId});
  if(error||typeof slug!=="string") redirect(`/academies?error=${encodeURIComponent(error?.message||"Academy could not be opened.")}`);
  redirect(`/m/${slug}/app`);
}
