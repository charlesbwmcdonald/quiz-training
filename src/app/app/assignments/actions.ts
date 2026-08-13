"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveAssignments(formData: FormData) {
  const quizId = String(formData.get("quizId") ?? "");
  const companyIds = formData.getAll("companyIds").map(String).filter(Boolean);
  const required = formData.get("required") === "on";
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!quizId || companyIds.length === 0) redirect("/app/assignments?error=Choose+a+quiz+and+at+least+one+retailer.");

  const supabase = await createSupabaseServerClient();
  for (const companyId of companyIds) {
    const { error } = await supabase.rpc("upsert_manufacturer_assignment", {
      target_company_id: companyId,
      target_quiz_id: quizId,
      required,
      target_due_at: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : null,
    });
    if (error) redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/app/assignments");
  revalidatePath("/app/retailers");
  redirect(`/app/assignments?saved=${companyIds.length}`);
}

export async function removeAssignment(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_manufacturer_assignment", {
    target_company_id: String(formData.get("companyId") ?? ""),
    target_quiz_id: String(formData.get("quizId") ?? ""),
  });
  if (error) redirect(`/app/assignments?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/assignments");
  revalidatePath("/app/retailers");
}
