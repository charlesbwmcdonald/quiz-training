"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function createCourse(formData:FormData){const title=String(formData.get("title")??"").trim();let blocks:unknown[]=[];try{blocks=JSON.parse(String(formData.get("blocks")??"[]"));}catch{redirect("/app/courses/new?error=Course+content+could+not+be+read.");}const supabase=await createSupabaseServerClient();const {error}=await supabase.rpc("create_course_with_blocks",{course_title:title,course_description:String(formData.get("description")??""),course_status:formData.get("intent")==="published"?"published":"draft",blocks});if(error)redirect(`/app/courses/new?error=${encodeURIComponent(error.message)}`);redirect("/app/courses?created=1");}
