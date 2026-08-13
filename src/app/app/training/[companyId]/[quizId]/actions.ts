"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitQuiz(formData: FormData) {
  const attemptId = String(formData.get("attemptId") ?? "");
  const brandSlug = String(formData.get("brandSlug") ?? "").replace(/[^a-z0-9-]/g, "");
  const portal = brandSlug ? `/m/${brandSlug}/app` : "/app";
  const questionIds = String(formData.get("questionIds") ?? "").split(",").filter(Boolean);
  const answers = questionIds.map(questionId => ({ question_id: questionId, choice_id: String(formData.get(`answer-${questionId}`) ?? "") }));
  if (!attemptId || answers.some(answer => !answer.choice_id)) redirect(`${portal}?error=Answer+every+question+before+submitting.`);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_quiz_attempt", { target_attempt_id: attemptId, submitted_answers: answers });
  if (error) redirect(`${portal}?error=${encodeURIComponent(error.message)}`);
  redirect(`${portal}/training/results/${(data as { attempt_id: string }).attempt_id}`);
}
