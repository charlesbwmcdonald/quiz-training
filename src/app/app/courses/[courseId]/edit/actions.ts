"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateCourse(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const intent = ["draft", "review", "published"].includes(String(formData.get("intent"))) ? String(formData.get("intent")) : "draft";
  let blocks: unknown[] = [];
  try {
    blocks = JSON.parse(String(formData.get("blocks") ?? "[]"));
  } catch {
    redirect(`/app/courses/${courseId}/edit?error=${encodeURIComponent("Course content could not be read.")}`);
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_course_with_blocks", {
    target_course_id: courseId,
    course_title: title,
    course_description: String(formData.get("description") ?? ""),
    course_status: intent === "published" ? "published" : "draft",
    blocks,
  });
  if (error) redirect(`/app/courses/${courseId}/edit?error=${encodeURIComponent(error.message)}`);
  if (intent === "review") {
    const { error: workflowError } = await supabase.rpc("set_content_workflow_status", { content_type: "course", target_content_id: courseId, next_status: "review" });
    if (workflowError) redirect(`/app/courses/${courseId}/edit?error=${encodeURIComponent(workflowError.message)}`);
  }
  redirect("/app/courses?updated=1");
}
