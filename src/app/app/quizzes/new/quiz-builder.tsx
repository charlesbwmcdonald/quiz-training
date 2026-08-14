"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createQuiz } from "./actions";
import { updateQuiz } from "../[quizId]/edit/actions";

export type Choice = { id: string; label: string; isCorrect: boolean };
export type Question = { id: string; prompt: string; imageUrl: string; choices: Choice[] };
export type ProductImageOption = { productId: string; name: string; imageUrl: string; detail: string };
const uid = () => Math.random().toString(36).slice(2);
const blankQuestion = (): Question => ({ id: uid(), prompt: "", imageUrl: "", choices: [{ id: uid(), label: "", isCorrect: true }, { id: uid(), label: "", isCorrect: false }] });

function SubmitButton({ intent, children, primaryColor }: { intent: "draft" | "published"; children: React.ReactNode; primaryColor: string }) {
  const { pending } = useFormStatus();
  return <button name="intent" value={intent} disabled={pending} style={intent === "published" ? { backgroundColor: primaryColor } : undefined} className={intent === "published" ? "min-h-12 px-6 font-extrabold uppercase tracking-wide text-white hover:brightness-90 disabled:opacity-50" : "min-h-12 border border-black/25 bg-white px-6 font-bold uppercase tracking-wide hover:border-black disabled:opacity-50"}>{pending ? "Saving…" : children}</button>;
}

export default function QuizBuilder({ error, primaryColor, initial, quizId, productImages = [] }: { error?: string; primaryColor: string; initial?: { title: string; description: string; passingScore: number; status: "draft" | "published"; questions: Question[] }; quizId?: string; productImages?: ProductImageOption[] }) {
  const [questions, setQuestions] = useState<Question[]>(initial?.questions?.length ? initial.questions : [blankQuestion()]);
  const [recoveryReady, setRecoveryReady] = useState(Boolean(quizId));
  useEffect(() => {
    if (quizId) return;
    try {
      const saved = window.localStorage.getItem("jobbertrain-new-quiz-questions");
      if (saved) {
        const recovered = JSON.parse(saved) as Question[];
        if (Array.isArray(recovered) && recovered.length) setQuestions(recovered);
      }
    } catch {}
    setRecoveryReady(true);
  }, [quizId]);
  useEffect(() => {
    if (!quizId && recoveryReady) window.localStorage.setItem("jobbertrain-new-quiz-questions", JSON.stringify(questions));
  }, [questions, quizId, recoveryReady]);
  const updateQuestion = (id: string, prompt: string) => setQuestions((all) => all.map((q) => q.id === id ? { ...q, prompt } : q));
  const updateQuestionImage = (id: string, imageUrl: string) => setQuestions((all) => all.map((q) => q.id === id ? { ...q, imageUrl } : q));
  const updateChoice = (questionId: string, choiceId: string, label: string) => setQuestions((all) => all.map((q) => q.id === questionId ? { ...q, choices: q.choices.map((c) => c.id === choiceId ? { ...c, label } : c) } : q));
  const setCorrect = (questionId: string, choiceId: string) => setQuestions((all) => all.map((q) => q.id === questionId ? { ...q, choices: q.choices.map((c) => ({ ...c, isCorrect: c.id === choiceId })) } : q));
  const addChoice = (questionId: string) => setQuestions((all) => all.map((q) => q.id === questionId ? { ...q, choices: [...q.choices, { id: uid(), label: "", isCorrect: false }] } : q));
  const removeChoice = (questionId: string, choiceId: string) => setQuestions((all) => all.map((q) => q.id === questionId ? { ...q, choices: q.choices.filter((c) => c.id !== choiceId) } : q));

  return (
    <form action={quizId ? updateQuiz : createQuiz} className="mt-8 grid gap-6">
      {quizId && <input type="hidden" name="quizId" value={quizId} />}
      <input type="hidden" name="questions" value={JSON.stringify(questions.map(({ prompt, imageUrl, choices }) => ({ prompt, image_url: imageUrl, choices: choices.map(({ label, isCorrect }) => ({ label, isCorrect })) })))} />
      {error && <div role="alert" style={{ borderColor: primaryColor }} className="border-l-4 bg-red-50 p-4 font-semibold text-red-900"><p>{error}</p>{!quizId && <p className="mt-2 text-sm font-normal">Your question draft is stored in this browser and should be restored automatically.</p>}</div>}
      {!quizId && recoveryReady && questions.length > 1 && <div className="flex items-center justify-between gap-4 bg-blue-50 p-4 text-sm text-blue-950"><span><b>Draft recovery is on.</b> {questions.length} questions are saved in this browser.</span><button type="button" onClick={() => { window.localStorage.removeItem("jobbertrain-new-quiz-questions"); setQuestions([blankQuestion()]); }} className="font-bold uppercase underline">Clear draft</button></div>}
      <section className="border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-extrabold uppercase">Quiz details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_180px]">
          <label className="grid gap-2 font-bold">Quiz title<input name="title" required defaultValue={initial?.title} placeholder="Example: Executive Fifth Wheel Basics" className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#d90000]" /></label>
          <label className="grid gap-2 font-bold">Passing score<input name="passingScore" type="number" min="0" max="100" defaultValue={initial?.passingScore ?? 80} required className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#d90000]" /></label>
        </div>
        <label className="mt-5 grid gap-2 font-bold">Description<textarea name="description" rows={3} defaultValue={initial?.description} placeholder="What will dealers learn from this quiz?" className="border border-black/20 p-4 font-normal outline-none focus:border-[#d90000]" /></label>
      </section>

      {questions.map((question, questionIndex) => (
        <section key={question.id} className="border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-extrabold uppercase">Question {questionIndex + 1}</h2>{questions.length > 1 && <button type="button" onClick={() => setQuestions((all) => all.filter((q) => q.id !== question.id))} style={{ color: primaryColor }} className="text-sm font-bold hover:underline">Remove question</button>}</div>
          <label className="mt-5 grid gap-2 font-bold">Question prompt<textarea value={question.prompt} onChange={(e) => updateQuestion(question.id, e.target.value)} rows={2} placeholder="Enter the question" className="border border-black/20 p-4 font-normal outline-none focus:border-[#d90000]" /></label>
          <div className="mt-4 grid gap-3">
            {productImages.length > 0 && <label className="grid gap-2 font-bold">Use a product-library image <span className="text-xs font-normal text-black/45">Includes parent products and individual variations</span><select value="" onChange={(event) => { if (event.target.value) updateQuestionImage(question.id, event.target.value); }} className="min-h-11 border border-black/20 bg-white px-4 font-normal outline-none focus:border-black"><option value="">Choose a product image…</option>{productImages.map((product) => <option key={`${product.productId}-${product.imageUrl}`} value={product.imageUrl}>{product.name} · {product.detail}</option>)}</select></label>}
            <label className="grid gap-2 font-bold">Question image URL <span className="text-xs font-normal text-black/45">Optional · select above or paste a different image URL</span><input value={question.imageUrl} onChange={(e) => updateQuestionImage(question.id, e.target.value)} placeholder="https://…" className="min-h-11 border border-black/20 px-4 font-normal outline-none focus:border-[#d90000]" /></label>
            {question.imageUrl && <div className="flex items-start gap-4 border border-black/10 bg-black/[.025] p-3"><img src={question.imageUrl} alt="Question preview" className="h-24 w-32 object-contain bg-white" /><div><b className="text-xs uppercase">Question image preview</b><button type="button" onClick={() => updateQuestionImage(question.id, "")} className="mt-3 block text-xs font-bold uppercase text-red-700">Remove image</button></div></div>}
          </div>
          <fieldset className="mt-6"><legend className="font-bold">Answer choices <span className="font-normal text-black/50">(select the correct answer)</span></legend>
            <div className="mt-3 grid gap-3">{question.choices.map((choice, choiceIndex) => <div key={choice.id} className="flex items-start gap-3"><input type="radio" name={`correct-${question.id}`} checked={choice.isCorrect} onChange={() => setCorrect(question.id, choice.id)} aria-label={`Mark answer ${choiceIndex + 1} correct`} style={{ accentColor: primaryColor }} className="mt-3 h-5 w-5 shrink-0" /><textarea value={choice.label} onChange={(e) => updateChoice(question.id, choice.id, e.target.value)} placeholder={`Answer ${choiceIndex + 1}`} rows={2} className="min-h-14 flex-1 resize-y border border-black/20 px-4 py-3 outline-none focus:border-black" />{question.choices.length > 2 && <button type="button" onClick={() => removeChoice(question.id, choice.id)} className="mt-2 px-2 text-xl text-black/40 hover:text-black" aria-label={`Remove answer ${choiceIndex + 1}`}>×</button>}</div>)}</div>
            <button type="button" onClick={() => addChoice(question.id)} style={{ color: primaryColor }} className="mt-4 text-sm font-extrabold uppercase tracking-wide hover:underline">+ Add answer choice</button>
          </fieldset>
        </section>
      ))}

      <button type="button" onClick={() => setQuestions((all) => [...all, blankQuestion()])} className="min-h-14 border-2 border-dashed border-black/20 bg-white font-extrabold uppercase tracking-wide hover:border-black">+ Add another question</button>
      <div className="flex flex-col justify-end gap-3 sm:flex-row"><SubmitButton intent="draft" primaryColor={primaryColor}>{initial?.status === "published" ? "Unpublish & save" : "Save draft"}</SubmitButton><SubmitButton intent="published" primaryColor={primaryColor}>{quizId ? "Save & publish" : "Save & publish"}</SubmitButton></div>
    </form>
  );
}
