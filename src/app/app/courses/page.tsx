import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CourseCardActions from "./course-card-actions";

type Course = { course_id: string; title: string; description: string | null; status: string; block_count: number; assignment_count: number };
export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: courses }, { data: internalRows }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("manufacturer_courses"),
    supabase.rpc("internal_assigned_course_ids"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const internal = new Set((internalRows ?? []).map((row: { course_id: string }) => row.course_id));

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-extrabold uppercase italic tracking-[.2em]" style={{ color: brand.primary_color }}>Learning library</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Course Library</h1><p className="mt-3 max-w-2xl text-black/60">Create structured product-learning courses, organize reusable content, and publish them when they are ready for your teams.</p></div><div className="flex flex-wrap gap-3"><Link href={`/m/${brand.slug}/app/courses/import`} className="inline-flex min-h-12 items-center justify-center border-2 border-black px-5 font-extrabold uppercase tracking-wide transition hover:bg-black hover:text-white">Import CSV</Link><Link href={`/m/${brand.slug}/app/courses/new`} className="inline-flex min-h-12 items-center justify-center px-6 font-extrabold uppercase tracking-wide text-white transition hover:brightness-90" style={{ backgroundColor: brand.primary_color }}>+ Create Course</Link></div></div>
      {query.error && <div className="mt-6 bg-red-50 p-4 text-red-900">{query.error}</div>}
      <section className="mt-10 border border-black/10 bg-white shadow-sm"><div className="hidden grid-cols-[minmax(0,1.5fr)_100px_120px_120px_150px_110px] items-center gap-5 border-b border-black/10 bg-black/[.03] px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-black/45 lg:grid"><span>Course</span><span>Status</span><span>Content</span><span>Activity</span><span>Audience</span><span className="justify-self-end">Actions</span></div>{((courses as Course[]) ?? []).map((course) => {
        const assignedInternally = internal.has(course.course_id);
        return <article key={course.course_id} className="grid min-h-20 gap-4 border-b border-black/10 px-5 py-5 last:border-0 lg:grid-cols-[minmax(0,1.5fr)_100px_120px_120px_150px_110px] lg:items-center lg:gap-5"><div className="min-w-0"><Link href={`/m/${brand.slug}/app/courses/${course.course_id}/preview`} className="font-extrabold uppercase hover:underline">{course.title}</Link><p className="mt-1 truncate text-sm text-black/45">{course.description||"Product learning course"}</p></div><div><span className={course.status==="published"?"inline-flex bg-green-50 px-2 py-1 text-[10px] font-extrabold uppercase text-green-800":course.status==="archived"?"inline-flex bg-amber-50 px-2 py-1 text-[10px] font-extrabold uppercase text-amber-800":"inline-flex bg-black/5 px-2 py-1 text-[10px] font-extrabold uppercase text-black/55"}>{course.status}</span></div><div><span className="mr-2 text-[10px] font-extrabold uppercase text-black/35 lg:hidden">Content</span><b>{course.block_count}</b><span className="ml-1 text-xs text-black/45">blocks</span></div><div><span className="mr-2 text-[10px] font-extrabold uppercase text-black/35 lg:hidden">Activity</span><b>{course.assignment_count}</b><span className="ml-1 text-xs text-black/45">retailers</span></div><div>{assignedInternally?<span className="inline-flex bg-blue-50 px-2 py-1 text-[10px] font-extrabold uppercase text-blue-800">Manufacturer team</span>:Number(course.assignment_count)>0?<span className="text-xs font-bold uppercase text-black/45">Retailers</span>:<span className="text-xs text-black/35">Unassigned</span>}</div><CourseCardActions courseId={course.course_id} hasAssignments={Number(course.assignment_count)>0||assignedInternally} brandSlug={brand.slug} status={course.status}/></article>;
      })}{!courses?.length&&<p className="p-10 text-center text-black/50">No courses yet.</p>}</section>
    </main>
  </div>;
}
