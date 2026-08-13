"use client";

import { useFormStatus } from "react-dom";
import { assignInternalQuiz, changeQuizStatus, deleteQuiz, duplicateQuiz } from "./quiz-actions";
import Link from "next/link";

function ActionButton({ children, danger, confirmMessage }: { children: React.ReactNode; danger?: boolean; confirmMessage?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} onClick={(event) => { if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault(); }} style={{ fontSize: 12, fontWeight: 800, lineHeight: 1, letterSpacing: "0.04em" }} className={danger ? "inline-flex min-h-8 items-center whitespace-nowrap uppercase text-red-700 hover:underline disabled:opacity-50" : "inline-flex min-h-8 items-center whitespace-nowrap uppercase text-black/55 hover:text-black disabled:opacity-50"}>{pending ? "Working…" : children}</button>;
}

export default function QuizCardActions({ quizId, status, hasAttempts, brandSlug, assignedInternally }: { quizId: string; status: "draft" | "published" | "archived"; hasAttempts: boolean; brandSlug: string; assignedInternally: boolean }) {
  return <div className="mt-5 flex min-h-8 flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/10 pt-4">
    <Link href={`/m/${brandSlug}/app/quizzes/${quizId}/preview`} style={{ fontSize: 12, fontWeight: 800, lineHeight: 1, letterSpacing: "0.04em" }} className="inline-flex min-h-8 items-center whitespace-nowrap uppercase text-black/55 hover:text-black">Preview</Link>
    {status === "published" && (assignedInternally ? <Link href={`/m/${brandSlug}/app/team-training`} style={{ fontSize: 12, fontWeight: 800, lineHeight: 1, letterSpacing: "0.04em" }} className="inline-flex min-h-8 items-center whitespace-nowrap uppercase text-blue-700 hover:underline">Team assigned</Link> : <form action={assignInternalQuiz}><input type="hidden" name="quizId" value={quizId} /><ActionButton>Assign to team</ActionButton></form>)}
    {status !== "archived" && <form action={changeQuizStatus}><input type="hidden" name="quizId" value={quizId} /><input type="hidden" name="status" value={status === "published" ? "draft" : "published"} /><ActionButton>{status === "published" ? "Unpublish" : "Publish"}</ActionButton></form>}
    <form action={duplicateQuiz}><input type="hidden" name="quizId" value={quizId} /><ActionButton>Duplicate</ActionButton></form>
    <form action={changeQuizStatus}><input type="hidden" name="quizId" value={quizId} /><input type="hidden" name="status" value={status === "archived" ? "draft" : "archived"} /><ActionButton confirmMessage={status === "archived" ? undefined : "Archive this quiz? It will no longer be available for new assignments."}>{status === "archived" ? "Restore" : "Archive"}</ActionButton></form>
    {!hasAttempts && <form action={deleteQuiz}><input type="hidden" name="quizId" value={quizId} /><ActionButton danger confirmMessage="Permanently delete this quiz? This cannot be undone.">Delete</ActionButton></form>}
  </div>;
}
