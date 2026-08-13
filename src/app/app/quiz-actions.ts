"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function run(name: "set_quiz_status" | "duplicate_quiz" | "delete_quiz_permanently", quizId: string, nextStatus?: string) {
  const supabase = await createSupabaseServerClient();
  const args = name === "set_quiz_status" ? { target_quiz_id: quizId, next_status: nextStatus } : { target_quiz_id: quizId };
  const { error } = await supabase.rpc(name, args);
  if (error) redirect(`/app?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app");
}

export async function assignInternalQuiz(formData: FormData) {
  const quizId = String(formData.get("quizId") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("assign_quiz_to_internal_team", {
    target_quiz_id: quizId,
    required: true,
    target_due_at: null,
  });
  if (error) redirect(`/app?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app");
  revalidatePath("/app/team-training");
}

export async function changeQuizStatus(formData: FormData) {
  await run("set_quiz_status", String(formData.get("quizId") ?? ""), String(formData.get("status") ?? "draft"));
}

export async function duplicateQuiz(formData: FormData) {
  await run("duplicate_quiz", String(formData.get("quizId") ?? ""));
}

export async function deleteQuiz(formData: FormData) {
  await run("delete_quiz_permanently", String(formData.get("quizId") ?? ""));
}
