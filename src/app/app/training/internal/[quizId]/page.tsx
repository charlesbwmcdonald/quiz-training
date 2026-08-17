import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuizPlayer from "@/app/app/training/[companyId]/[quizId]/quiz-player";

type QuizPayload = { attempt_id: string; title: string; description: string | null; passing_score: number; questions: { id: string; prompt: string; image_url: string | null; position: number; choices: { id: string; label: string; position: number }[] }[] };

export default async function TakeInternalQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([supabase.auth.getUser(), getActiveBrand()]);
  if (!auth.user) redirect("/login");
  if (!brand) redirect("/app");
  const { data, error } = await supabase.rpc("start_internal_quiz", { target_quiz_id: quizId });
  if (error || !data) notFound();
  const quiz = data as QuizPayload;

  return <div className="min-h-screen bg-[#f4f4f2] text-black"><ManufacturerHeader brand={brand} email={auth.user.email} /><main className="px-5 py-8 lg:px-8 lg:py-12"><div className="mx-auto mb-7 max-w-4xl"><Link href={`/m/${brand.slug}/app/my-training`} className="text-sm font-bold uppercase tracking-wide text-black/50 hover:text-black">← My Training</Link><p className="mt-6 text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: brand.primary_color }}>{brand.name} team training</p><h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tight">{quiz.title}</h1><p className="mt-2 text-sm text-black/55">Score {quiz.passing_score}% or higher to pass.</p></div><QuizPlayer quiz={quiz} primaryColor={brand.primary_color} brandSlug={brand.slug} /></main></div>;
}
