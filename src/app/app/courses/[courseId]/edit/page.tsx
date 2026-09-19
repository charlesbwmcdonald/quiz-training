import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CourseBuilder, { type EditableCourse } from "../../new/course-builder";
import { ContentEditWarnings, ContentGovernanceDetails, type ContentGovernanceRecord } from "@/components/content-governance";
import { ContentGovernancePanel } from "@/components/content-governance-panel";
import type { ContentReviewEvent, ContentSchedule, ContentVersion } from "@/components/content-governance";

type CourseBlockRow = { id: string; type: "rich_text" | "product_card" | "video" | "quiz"; title: string | null; content: { body?: string; annotation?: string; url?: string; product_id?: string }; quiz_id: string | null; required: boolean };
type CourseRow = { id: string; title: string; description: string | null; status: "draft" | "review" | "published"; has_activity: boolean; blocks: CourseBlockRow[] };
type Quiz = { quiz_id: string; title: string };
type Product = { product_id: string; name: string; category_name?: string; is_family: boolean; variation_count: number; status?: string; parent_product_id?: string | null };

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ error?: string;reviewed?:string;restored?:string;scheduled?:string;cancelled?:string;templateSaved?:string;fromTemplate?:string }> }) {
  const [{ courseId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: courseData, error }, { data: quizzes }, { data: productRows }, { data: governanceRows }, {data:versions}, {data:reviews}, {data:scheduleRows}] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("get_manufacturer_course_for_edit", { target_course_id: courseId }),
    supabase.rpc("manufacturer_published_quizzes"),
    supabase.rpc("manufacturer_products_v2"),
    supabase.rpc("manufacturer_content_governance"),
    supabase.rpc("content_version_history",{content_type:"course",target_content_id:courseId}),
    supabase.rpc("content_review_history",{content_type:"course",target_content_id:courseId}),
    supabase.rpc("manufacturer_content_schedules"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  if (error || !courseData) notFound();

  const course = courseData as CourseRow;
  const governance = ((governanceRows ?? []) as ContentGovernanceRecord[]).find((item) => item.content_type === "course" && item.content_id === courseId);
  const initialCourse: EditableCourse = {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    status: course.status,
    hasActivity: course.has_activity,
    blocks: course.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      title: block.title ?? "",
      body: block.type === "product_card" ? block.content?.annotation ?? "" : block.content?.body ?? "",
      url: block.content?.url ?? "",
      quizId: block.quiz_id ?? "",
      productId: block.content?.product_id ?? "",
      required: block.required,
    })),
  };
  const products = ((productRows as Product[]) ?? []).filter((product) => product.status === "published" && !product.parent_product_id);

  return <div className="min-h-screen bg-[#f4f4f2]"><ManufacturerHeader brand={brand} email={auth.user.email} /><main className="mx-auto max-w-5xl px-5 py-10 lg:py-14"><Link href={`/m/${brand.slug}/app/courses`} className="font-extrabold uppercase">← Course Library</Link><p className="mt-8 text-sm font-extrabold uppercase italic tracking-[.2em]" style={{ color: brand.primary_color }}>Course builder</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Edit Course</h1><p className="mt-3 max-w-2xl text-black/60">Update course details and learning blocks without creating a new course or losing its assignments.</p><ContentGovernanceDetails record={governance}/><ContentEditWarnings status={course.status} assignmentCount={Number(governance?.assignment_count ?? 0)} noun="course"/><ContentGovernancePanel contentType="course" contentId={courseId} status={course.status} returnTo={`/app/courses/${courseId}/edit`} canReview={Boolean(brand.can_manage_brand)} versions={(versions??[]) as ContentVersion[]} reviews={(reviews??[]) as ContentReviewEvent[]} schedules={((scheduleRows??[]) as ContentSchedule[]).filter(item=>item.content_type==="course"&&item.content_id===courseId)} message={query.error?{kind:"error",text:query.error}:query.templateSaved?{kind:"success",text:"Template saved to your academy library."}:query.fromTemplate?{kind:"success",text:"Fresh draft created from the template. Review and customize it before publishing."}:query.restored?{kind:"success",text:"Previous version restored as a draft."}:query.reviewed?{kind:"success",text:query.reviewed==="approved"?"Content approved and published.":"Content returned to draft with reviewer notes."}:query.scheduled?{kind:"success",text:"Content schedule saved."}:query.cancelled?{kind:"success",text:"Scheduled action cancelled."}:undefined}/><CourseBuilder quizzes={(quizzes as Quiz[]) ?? []} products={products} primary={brand.primary_color} error={query.error} initialCourse={initialCourse} /></main></div>;
}
