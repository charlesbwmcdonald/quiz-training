import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Result = { title: string; score: number; passing_score: number; passed: boolean };
export default async function QuizResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params; const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([supabase.auth.getUser(), getActiveBrand()]);
  if (!auth.user) redirect("/login"); if (!brand) redirect("/app");
  const { data } = await supabase.rpc("get_quiz_attempt_result", { target_attempt_id: attemptId }); if (!data) notFound(); const result = data as Result;
  return <div className="min-h-screen bg-[#f4f4f2] text-black"><ManufacturerHeader brand={brand} email={auth.user.email} /><main className="grid min-h-[calc(100vh-86px)] place-items-center px-5 py-12"><section className="w-full max-w-2xl border border-black/10 bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto grid h-24 w-24 place-items-center rounded-full text-3xl font-black text-white" style={{ backgroundColor: result.passed ? "#15803d" : brand.primary_color }}>{result.score}%</div><p className="mt-7 text-sm font-extrabold uppercase tracking-[0.2em]" style={{ color: result.passed ? "#15803d" : brand.primary_color }}>{result.passed ? "Training complete" : "Keep learning"}</p><h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight">{result.passed ? "You passed" : "Not quite yet"}</h1><p className="mx-auto mt-4 max-w-lg text-black/60">{result.passed ? `Great work - you demonstrated strong knowledge of ${result.title}.` : `You need ${result.passing_score}% to pass. Review the material and try again when you’re ready.`}</p><div className="mt-8 grid grid-cols-2 border-y border-black/10 py-5"><div><b className="block text-2xl">{result.score}%</b><span className="text-xs uppercase text-black/45">Your score</span></div><div><b className="block text-2xl">{result.passing_score}%</b><span className="text-xs uppercase text-black/45">Passing score</span></div></div><Link href={`/m/${brand.slug}/app`} className="mt-8 inline-flex min-h-12 items-center justify-center px-7 font-extrabold uppercase tracking-wide text-white" style={{ backgroundColor: brand.primary_color }}>Return to my training</Link></section></main></div>;
}
