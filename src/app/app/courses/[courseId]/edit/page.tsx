import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CourseBuilder, { type EditableCourse } from "../../new/course-builder";

type CourseBlockRow = { id: string; type: "rich_text" | "product_card" | "video" | "quiz"; title: string | null; content: { body?: string; annotation?: string; url?: string; product_id?: string }; quiz_id: string | null; required: boolean };
type CourseRow = { id: string; title: string; description: string | null; status: "draft" | "published"; has_activity: boolean; blocks: CourseBlockRow[] };
type Quiz = { quiz_id: string; title: string };
type Product = { product_id: string; name: string; category_name?: string; is_family: boolean; variation_count: number; status?: string; parent_product_id?: string | null };

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ courseId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: courseData, error }, { data: quizzes }, { data: productRows }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("get_manufacturer_course_for_edit", { target_course_id: courseId }),
    supabase.rpc("manufacturer_published_quizzes"),
    supabase.rpc("manufacturer_products_v2"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  if (error || !courseData) notFound();

  const course = courseData as CourseRow;
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

  return <div className="min-h-screen bg-[#f4f4f2]"><ManufacturerHeader brand={brand} email={auth.user.email} /><main className="mx-auto max-w-5xl px-5 py-10 lg:py-14"><Link href={`/m/${brand.slug}/app/courses`} className="font-extrabold uppercase">← Course Library</Link><p className="mt-8 text-sm font-extrabold uppercase italic tracking-[.2em]" style={{ color: brand.primary_color }}>Course builder</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Edit Course</h1><p className="mt-3 max-w-2xl text-black/60">Update course details and learning blocks without creating a new course or losing its assignments.</p><CourseBuilder quizzes={(quizzes as Quiz[]) ?? []} products={products} primary={brand.primary_color} error={query.error} initialCourse={initialCourse} /></main></div>;
}
