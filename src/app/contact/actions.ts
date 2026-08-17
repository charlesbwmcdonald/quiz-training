"use server";

import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";

export async function submitContactInquiry(formData:FormData){
  if(String(formData.get("companySite")??""))redirect("/contact?sent=1");
  const name=String(formData.get("name")??"").trim(),email=String(formData.get("email")??"").trim().toLowerCase(),company=String(formData.get("company")??"").trim(),primaryGoal=String(formData.get("primaryGoal")??"").trim();
  if(name.length<2||company.length<2||primaryGoal.length<10||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))redirect("/contact?error=Please+complete+the+required+fields+with+valid+information.");
  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.from("contact_inquiries").insert({name,email,company,job_title:String(formData.get("jobTitle")??"").trim()||null,website:String(formData.get("website")??"").trim()||null,retailer_count:String(formData.get("retailerCount")??"").trim()||null,current_process:String(formData.get("currentProcess")??"").trim()||null,primary_goal:primaryGoal,launch_timeline:String(formData.get("launchTimeline")??"").trim()||null,service_tier:String(formData.get("serviceTier")??"").trim()||null});
  if(error)redirect(`/contact?error=${encodeURIComponent("We could not save your request. Please try again.")}`);
  redirect("/contact?sent=1");
}
