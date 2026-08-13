"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChoiceInput = { label?: unknown; isCorrect?: unknown };
type QuestionInput = { prompt?: unknown; image_url?: unknown; choices?: ChoiceInput[] };

export async function createQuiz(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const passingScore = Number(formData.get("passingScore") ?? 80);
  const questionsJson = String(formData.get("questions") ?? "[]");
  const intent = formData.get("intent") === "published" ? "published" : "draft";
  let questions: QuestionInput[] = [];

  try { questions = JSON.parse(questionsJson); } catch { redirect("/app/quizzes/new?error=The+quiz+questions+could+not+be+read."); }
  if (!title) redirect("/app/quizzes/new?error=Please+add+a+quiz+title.");
  if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) redirect("/app/quizzes/new?error=Passing+score+must+be+between+0+and+100.");
  if (!Array.isArray(questions) || questions.length === 0) redirect("/app/quizzes/new?error=Add+at+least+one+question.");

  const normalized = questions.map((question) => ({
    prompt: String(question.prompt ?? "").trim(),
    image_url: String(question.image_url ?? "").trim() || null,
    choices: Array.isArray(question.choices) ? question.choices.map((choice) => ({ label: String(choice.label ?? "").trim(), is_correct: choice.isCorrect === true })) : [],
  }));
  const invalid = normalized.some((question) => !question.prompt || question.choices.length < 2 || question.choices.some((choice) => !choice.label) || question.choices.filter((choice) => choice.is_correct).length !== 1);
  if (invalid) redirect("/app/quizzes/new?error=Each+question+needs+a+prompt,+at+least+two+answers,+and+one+correct+answer.");

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");
  const { error } = await supabase.rpc("create_quiz_with_questions", {
    quiz_title: title,
    quiz_description: description || null,
    quiz_passing_score: passingScore,
    quiz_status: intent,
    questions: normalized,
  });
  if (error) redirect(`/app/quizzes/new?error=${encodeURIComponent(error.message)}`);
  redirect("/app?created=1");
}
