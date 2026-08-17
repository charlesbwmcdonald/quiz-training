"use client";

import { useFormStatus } from "react-dom";
import { changeQuizStatus, deleteQuiz, duplicateQuiz } from "./quiz-actions";
import Link from "next/link";

function ActionButton({ children, danger, confirmMessage }: { children: React.ReactNode; danger?: boolean; confirmMessage?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} onClick={(event) => { if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault(); }} style={{ fontSize: 12, fontWeight: 800, lineHeight: 1, letterSpacing: "0.04em" }} className={danger ? "inline-flex min-h-8 items-center whitespace-nowrap uppercase text-red-700 hover:underline disabled:opacity-50" : "inline-flex min-h-8 items-center whitespace-nowrap uppercase text-black/55 hover:text-black disabled:opacity-50"}>{pending ? "Working…" : children}</button>;
}

export default function QuizCardActions({ quizId, status, hasAttempts, brandSlug, assignedInternally }: { quizId: string; status: "draft" | "published" | "archived"; hasAttempts: boolean; brandSlug: string; assignedInternally: boolean }) {
  const item="flex min-h-10 w-full items-center px-4 text-left text-xs font-extrabold uppercase tracking-wide text-black/60 hover:bg-black/5 hover:text-black";
  return <details className="group relative justify-self-end"><summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 border-2 border-black px-4 text-xs font-extrabold uppercase marker:content-none hover:bg-black hover:text-white [&::-webkit-details-marker]:hidden">Manage <span className="text-[9px] transition group-open:rotate-180">▼</span></summary><div className="absolute right-0 z-40 mt-2 w-56 border border-black/15 bg-white py-2 shadow-2xl">
    <Link href={`/m/${brandSlug}/app/quizzes/${quizId}/preview`} className={item}>Preview</Link><Link href={`/m/${brandSlug}/app/quizzes/${quizId}/edit`} className={item}>Edit Quiz</Link>{status==="published"&&<Link href={`/m/${brandSlug}/app/assignments`} className={item}>{assignedInternally?"Team Assignment":"Assign Training"}</Link>}
    <div className="my-2 border-t border-black/10"/>{status!=="archived"&&<form action={changeQuizStatus}><input type="hidden" name="quizId" value={quizId}/><input type="hidden" name="status" value={status==="published"?"draft":"published"}/><div className="px-4"><ActionButton>{status==="published"?"Unpublish":"Publish"}</ActionButton></div></form>}<form action={duplicateQuiz}><input type="hidden" name="quizId" value={quizId}/><div className="px-4"><ActionButton>Duplicate</ActionButton></div></form><form action={changeQuizStatus}><input type="hidden" name="quizId" value={quizId}/><input type="hidden" name="status" value={status==="archived"?"draft":"archived"}/><div className="px-4"><ActionButton confirmMessage={status==="archived"?undefined:"Archive this quiz? It will no longer be available for new assignments."}>{status==="archived"?"Restore":"Archive"}</ActionButton></div></form>{!hasAttempts&&<form action={deleteQuiz}><input type="hidden" name="quizId" value={quizId}/><div className="px-4"><ActionButton danger confirmMessage="Permanently delete this quiz? This cannot be undone.">Delete</ActionButton></div></form>}
  </div></details>;
}
