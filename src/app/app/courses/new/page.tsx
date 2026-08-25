import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CourseBuilder from "./course-builder";
import { AcademyPageHeader } from "@/components/academy-ui";

type ProductOption = { product_id: string; name: string; category_name?: string; status: string; parent_product_id: string | null; is_family:boolean; variation_count:number };

export default async function NewCourse({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: quizzes }, { data: products }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("manufacturer_published_quizzes"),
    supabase.rpc("manufacturer_products_v2"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const publishedRoots = ((products ?? []) as ProductOption[]).filter((product) => product.status === "published" && !product.parent_product_id);
  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link href={`/m/${brand.slug}/app/courses`} className="font-bold text-black/50">← Courses</Link>
      <div className="mt-7"><AcademyPageHeader eyebrow="Course builder" title="Create Learning Course" description="Combine product knowledge, media, text lessons, and quizzes into one structured learning path." accent={brand.primary_color}/></div>
      <CourseBuilder quizzes={quizzes ?? []} products={publishedRoots} primary={brand.primary_color} error={query.error} />
    </main>
  </div>;
}
