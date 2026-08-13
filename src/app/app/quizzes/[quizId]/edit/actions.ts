"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChoiceInput = { label?: unknown; isCorrect?: unknown };
type QuestionInput = { prompt?: unknown; image_url?: unknown; choices?: ChoiceInput[] };

export async function updateQuiz(formData: FormData) {
  const quizId = String(formData.get("quizId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const passingScore = Number(formData.get("passingScore") ?? 80);
  const intent = formData.get("intent") === "published" ? "published" : "draft";
  const fail = (message: string): never => redirect(`/app/quizzes/${quizId}/edit?error=${encodeURIComponent(message)}`);
  let questions: QuestionInput[];
  try { questions = JSON.parse(String(formData.get("questions") ?? "[]")); } catch { fail("The quiz questions could not be read."); }
  if (!quizId || !title) fail("Please add a quiz title.");
  if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) fail("Passing score must be between 0 and 100.");
  const normalized = questions!.map((question) => ({ prompt: String(question.prompt ?? "").trim(), image_url: String(question.image_url ?? "").trim() || null, choices: Array.isArray(question.choices) ? question.choices.map((choice) => ({ label: String(choice.label ?? "").trim(), is_correct: choice.isCorrect === true })) : [] }));
  const invalid = !normalized.length || normalized.some((question) => !question.prompt || question.choices.length < 2 || question.choices.some((choice) => !choice.label) || question.choices.filter((choice) => choice.is_correct).length !== 1);
  if (invalid) fail("Each question needs a prompt, at least two answers, and one correct answer.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_quiz_with_questions", { target_quiz_id: quizId, quiz_title: title, quiz_description: description || null, quiz_passing_score: passingScore, quiz_status: intent, questions: normalized });
  if (error) fail(error.message);
  redirect("/app?updated=1");
}
