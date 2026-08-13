import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assignCourse, assignInternalCourse } from "./actions";
import CourseCardActions from "./course-card-actions";

type Course = { course_id: string; title: string; description: string | null; status: string; block_count: number; assignment_count: number };
type Retailer = { company_id: string; company_name: string };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: courses }, { data: retailers }, { data: internalRows }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("manufacturer_courses"),
    supabase.rpc("manufacturer_retailer_dashboard"),
    supabase.rpc("internal_assigned_course_ids"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const internal = new Set((internalRows ?? []).map((row: { course_id: string }) => row.course_id));

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row"><div><p className="text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Learning library</p><h1 className="mt-2 text-4xl font-extrabold uppercase">Courses</h1></div><div className="flex flex-wrap gap-3 self-end"><Link href={`/m/${brand.slug}/app/courses/import`} className="flex min-h-12 items-center border-2 border-black px-5 font-extrabold uppercase transition hover:bg-black hover:text-white">Import CSV</Link><Link href={`/m/${brand.slug}/app/courses/new`} className="flex min-h-12 items-center px-6 font-extrabold uppercase text-white" style={{ backgroundColor: brand.primary_color }}>+ Create course</Link></div></div>
      {query.error && <div className="mt-6 bg-red-50 p-4 text-red-900">{query.error}</div>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{((courses as Course[]) ?? []).map((course) => {
        const assignedInternally = internal.has(course.course_id);
        return <article key={course.course_id} className="flex flex-col border border-black/10 bg-white p-6">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase text-green-700">{course.status}</span>{assignedInternally && <span className="bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-blue-800">Internal team</span>}</div>
          <h2 className="mt-4 text-xl font-extrabold uppercase">{course.title}</h2>
          <p className="mt-2 min-h-12 text-sm leading-6 text-black/55">{course.description || "Product learning course"}</p>
          <div className="mt-5 flex gap-7 border-t border-black/10 pt-4 text-sm"><span><b>{course.block_count}</b> blocks</span><span><b>{course.assignment_count}</b> retailers</span></div>
          <div className="mt-auto pt-6">
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/m/${brand.slug}/app/courses/${course.course_id}/preview`} className="flex min-h-12 items-center justify-center border-2 border-black px-4 text-sm font-extrabold uppercase transition hover:bg-black hover:text-white">Preview</Link>
              {course.status === "published" && (assignedInternally ? <Link href={`/m/${brand.slug}/app/courses/${course.course_id}/internal`} className="flex min-h-12 items-center justify-center px-4 text-center text-sm font-extrabold uppercase text-white transition hover:brightness-90" style={{ backgroundColor: brand.primary_color }}>Open Team Course</Link> : <form action={assignInternalCourse}><input type="hidden" name="courseId" value={course.course_id} /><button className="min-h-12 w-full px-4 text-sm font-extrabold uppercase leading-tight text-white transition hover:brightness-90" style={{ backgroundColor: brand.primary_color }}>Assign to Team</button></form>)}
            </div>
            {course.status === "published" && <div className="mt-5 border-t border-black/10 pt-5"><p className="mb-2 text-xs font-extrabold uppercase tracking-[.12em] text-black/45">Retailer assignment</p><form action={assignCourse} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><input type="hidden" name="courseId" value={course.course_id} /><select name="companyId" required aria-label="Select retailer" className="min-h-12 min-w-0 border border-black/20 bg-white px-3 text-sm"><option value="">Choose retailer…</option>{((retailers as Retailer[]) ?? []).map((retailer) => <option key={retailer.company_id} value={retailer.company_id}>{retailer.company_name}</option>)}</select><button className="min-h-12 min-w-24 px-4 text-sm font-extrabold uppercase text-white transition hover:brightness-90" style={{ backgroundColor: brand.primary_color }}>Assign</button></form></div>}
            <CourseCardActions courseId={course.course_id} hasAssignments={Number(course.assignment_count)>0||assignedInternally}/>
          </div>
        </article>;
      })}</div>
    </main>
  </div>;
}
