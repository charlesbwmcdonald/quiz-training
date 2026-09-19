import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuizBuilder, { type ProductImageOption, type Question } from "../../new/quiz-builder";
import { ContentEditWarnings, ContentGovernanceDetails, type ContentGovernanceRecord } from "@/components/content-governance";
import { ContentGovernancePanel } from "@/components/content-governance-panel";
import type { ContentReviewEvent, ContentSchedule, ContentVersion } from "@/components/content-governance";

type QuizRow = { id: string; title: string; description: string | null; passing_score: number; status: "draft" | "review" | "published"; quiz_questions: { id: string; prompt: string; image_url: string | null; position: number; quiz_choices: { id: string; label: string; is_correct: boolean; position: number }[] }[] };

export default async function EditQuizPage({ params, searchParams }: { params: Promise<{ quizId: string }>; searchParams: Promise<{ error?: string;reviewed?:string;restored?:string;scheduled?:string;cancelled?:string;templateSaved?:string;fromTemplate?:string }> }) {
  const [{ quizId }, query, brand, supabase] = await Promise.all([params, searchParams, getActiveBrand(), createSupabaseServerClient()]);
  if (!brand?.can_manage_training) redirect("/app");
  const [{ data: auth }, { data }, { data: attemptCounts }, { data: products }, { data: governanceRows }, {data:versions}, {data:reviews}, {data:scheduleRows}] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("quizzes").select("id,title,description,passing_score,status,quiz_questions(id,prompt,image_url,position,quiz_choices(id,label,is_correct,position))").eq("id", quizId).single(),
    supabase.rpc("managed_quiz_attempt_counts"),
    supabase.rpc("manufacturer_products_v2"),
    supabase.rpc("manufacturer_content_governance"),
    supabase.rpc("content_version_history",{content_type:"quiz",target_content_id:quizId}),
    supabase.rpc("content_review_history",{content_type:"quiz",target_content_id:quizId}),
    supabase.rpc("manufacturer_content_schedules"),
  ]);
  if (!auth.user) redirect("/login");
  if (!data) notFound();
  const quiz = data as QuizRow;
  const count = Number((attemptCounts ?? []).find((item: { quiz_id: string; attempt_count: number }) => item.quiz_id === quizId)?.attempt_count ?? 0);
  const governance = ((governanceRows ?? []) as ContentGovernanceRecord[]).find((item) => item.content_type === "quiz" && item.content_id === quizId);
  const questions: Question[] = quiz.quiz_questions.sort((a,b) => a.position-b.position).map((question) => ({ id: question.id, prompt: question.prompt, imageUrl: question.image_url ?? "", choices: question.quiz_choices.sort((a,b) => a.position-b.position).map((choice) => ({ id: choice.id, label: choice.label, isCorrect: choice.is_correct })) }));
  const productImages = ((products ?? []) as { product_id:string; name:string; primary_image:string|null; parent_product_id:string|null; variation_label:string|null; model_sku:string|null; status:string }[])
    .filter((product) => product.status !== "archived" && Boolean(product.primary_image))
    .map((product): ProductImageOption => ({ productId:product.product_id, name:product.variation_label || product.name, imageUrl:product.primary_image!, detail:product.parent_product_id ? `Variation${product.model_sku ? ` · ${product.model_sku}` : ""}` : "Parent product" }));
  return <div className="min-h-screen bg-[#f4f4f2] text-black"><ManufacturerHeader brand={brand} email={auth.user?.email} /><main className="px-5 py-10 lg:px-8"><div className="mx-auto max-w-4xl"><Link href="/app" className="text-sm font-bold uppercase tracking-wide text-black/60 hover:underline">← Quiz library</Link><p className="mt-8 text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: brand.primary_color }}>Edit quiz</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">{quiz.title}</h1><ContentGovernanceDetails record={governance}/><ContentEditWarnings status={quiz.status} assignmentCount={Number(governance?.assignment_count ?? 0)} noun="quiz"/><ContentGovernancePanel contentType="quiz" contentId={quizId} status={quiz.status} returnTo={`/app/quizzes/${quizId}/edit`} canReview={Boolean(brand.can_manage_brand)} versions={(versions??[]) as ContentVersion[]} reviews={(reviews??[]) as ContentReviewEvent[]} schedules={((scheduleRows??[]) as ContentSchedule[]).filter(item=>item.content_type==="quiz"&&item.content_id===quizId)} message={query.error?{kind:"error",text:query.error}:query.templateSaved?{kind:"success",text:"Template saved to your academy library."}:query.fromTemplate?{kind:"success",text:"Fresh draft created from the template. Review and customize it before publishing."}:query.restored?{kind:"success",text:"Previous version restored as a draft."}:query.reviewed?{kind:"success",text:query.reviewed==="approved"?"Content approved and published.":"Content returned to draft with reviewer notes."}:query.scheduled?{kind:"success",text:"Content schedule saved."}:query.cancelled?{kind:"success",text:"Scheduled action cancelled."}:undefined}/>{count ? <div className="mt-6 rounded-md border-l-4 bg-amber-50 p-4 text-amber-950" style={{ borderColor: brand.primary_color }}><b>Question editing is locked.</b> This quiz has {count} attempt{count === 1 ? "" : "s"}. Duplicate it from the library to create a new editable version.</div> : <QuizBuilder error={query.error} primaryColor={brand.primary_color} quizId={quiz.id} productImages={productImages} initial={{ title: quiz.title, description: quiz.description ?? "", passingScore: quiz.passing_score, status: quiz.status, questions }} />}</div></main></div>;
}
