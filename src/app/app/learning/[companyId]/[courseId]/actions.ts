"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function completeCourseBlock(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const blockId = String(formData.get("blockId") ?? "");
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("complete_course_block", {
    target_company_id: companyId,
    target_course_id: courseId,
    target_block_id: blockId,
  });
  revalidatePath("/app");
  revalidatePath(`/app/learning/${companyId}/${courseId}`);
}
