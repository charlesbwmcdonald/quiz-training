"use client";
import { useState } from "react";
import { submitQuiz } from "./actions";
import { ImageLightbox } from "@/components/image-lightbox";

type Choice = { id: string; label: string; position: number };
type Question = { id: string; prompt: string; image_url: string | null; position: number; choices: Choice[] };
type Quiz = { attempt_id: string; title: string; description: string | null; passing_score: number; questions: Question[] };

export default function QuizPlayer({ quiz, primaryColor, brandSlug }: { quiz: Quiz; primaryColor: string; brandSlug: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const question = quiz.questions[step];
  const isLast = step === quiz.questions.length - 1;
  const answered = Boolean(answers[question.id]);
  return <form action={submitQuiz} className="mx-auto max-w-4xl">
    <input type="hidden" name="attemptId" value={quiz.attempt_id} /><input type="hidden" name="questionIds" value={quiz.questions.map(item => item.id).join(",")} /><input type="hidden" name="brandSlug" value={brandSlug} />
    {quiz.questions.map(item => <input key={item.id} type="hidden" name={`answer-${item.id}`} value={answers[item.id] ?? ""} />)}
    <div className="flex items-center justify-between gap-4 text-sm font-bold uppercase tracking-wide"><span>Question {step + 1} of {quiz.questions.length}</span><span>{Math.round(((step + 1) / quiz.questions.length) * 100)}%</span></div>
    <div className="mt-3 h-2 overflow-hidden bg-black/10"><div className="h-full transition-all" style={{ width: `${((step + 1) / quiz.questions.length) * 100}%`, backgroundColor: primaryColor }} /></div>
    <section className="mt-7 border border-black/10 bg-white p-6 shadow-sm sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-black/40">Choose one answer</p><h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">{question.prompt}</h1>
      {question.image_url && <ImageLightbox images={[{url:question.image_url,caption:question.prompt}]} alt="Question reference" className="mt-6 [&_button]:mx-auto [&_button]:max-h-96 [&_button]:max-w-full [&_img]:max-h-96 [&_img]:w-auto" />}
      <fieldset className="mt-8 grid gap-3"><legend className="sr-only">Answer choices</legend>{question.choices.map(choice => <label key={choice.id} className="flex min-h-16 cursor-pointer items-center gap-4 border-2 p-4 font-semibold transition hover:bg-black/[.02]" style={{ borderColor: answers[question.id] === choice.id ? primaryColor : "rgba(0,0,0,.12)", backgroundColor: answers[question.id] === choice.id ? `${primaryColor}0D` : "white" }}><input type="radio" checked={answers[question.id] === choice.id} onChange={() => setAnswers(current => ({ ...current, [question.id]: choice.id }))} className="h-5 w-5" /><span>{choice.label}</span></label>)}</fieldset>
    </section>
    <div className="mt-6 flex items-center justify-between gap-4"><button type="button" onClick={() => setStep(current => Math.max(0, current - 1))} disabled={step === 0} className="min-h-12 px-5 font-bold uppercase tracking-wide text-black/55 disabled:opacity-0">← Previous</button>{isLast ? <button type="submit" disabled={!answered} className="min-h-12 px-7 font-extrabold uppercase tracking-wide text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}>Submit quiz</button> : <button type="button" disabled={!answered} onClick={() => setStep(current => Math.min(quiz.questions.length - 1, current + 1))} className="min-h-12 px-7 font-extrabold uppercase tracking-wide text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}>Next question →</button>}</div>
  </form>;
}
