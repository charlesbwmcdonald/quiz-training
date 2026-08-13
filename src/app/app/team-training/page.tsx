import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InternalCourse = { course_id: string; title: string; description: string | null; is_required: boolean; due_at: string | null; block_count: number; completed_block_count: number };
type InternalQuiz = { quiz_id: string; title: string; description: string | null; passing_score: number; is_required: boolean; due_at: string | null; attempt_status: string | null; latest_score: number | null };

export default async function TeamTrainingPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: courseRows }, { data: quizRows }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("internal_team_courses"),
    supabase.rpc("internal_team_quizzes"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand) redirect("/app");
  const courses = (courseRows ?? []) as InternalCourse[];
  const quizzes = (quizRows ?? []) as InternalQuiz[];
  const isEmpty = courses.length === 0 && quizzes.length === 0;

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Manufacturer learning</p>
      <h1 className="mt-2 text-4xl font-extrabold uppercase">Internal Team Training</h1>
      <p className="mt-3 text-black/55">Courses and standalone quizzes assigned to everyone on the {brand.name} team.</p>

      {isEmpty ? <section className="mt-8 grid min-h-64 place-items-center border-2 border-dashed border-black/15 bg-white p-8 text-center"><div><h2 className="text-2xl font-extrabold uppercase">No internal training yet</h2><p className="mt-2 text-black/55">A training manager can assign a published course or quiz to the internal team.</p></div></section> : <>
        {quizzes.length > 0 && <section className="mt-10"><h2 className="text-2xl font-extrabold uppercase">Standalone quizzes</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{quizzes.map((quiz) => <article key={quiz.quiz_id} className="border border-black/10 bg-white p-6 shadow-sm"><span className={quiz.is_required ? "bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-800" : "bg-black/5 px-3 py-1 text-xs font-bold uppercase"}>{quiz.is_required ? "Required quiz" : "Optional quiz"}</span><h3 className="mt-5 text-xl font-extrabold uppercase">{quiz.title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-black/55">{quiz.description || "Internal product knowledge check."}</p><div className="mt-5 border-t border-black/10 pt-4 text-sm"><b>{quiz.passing_score}% to pass</b>{quiz.attempt_status && <p className="mt-1 font-bold uppercase" style={{ color: brand.primary_color }}>{quiz.attempt_status}{quiz.latest_score !== null ? ` · ${quiz.latest_score}%` : ""}</p>}</div><Link href={`/m/${brand.slug}/app/training/internal/${quiz.quiz_id}`} className="mt-5 flex min-h-11 items-center justify-center px-4 text-xs font-extrabold uppercase text-white" style={{ backgroundColor: brand.primary_color }}>{quiz.attempt_status === "in_progress" ? "Continue quiz" : quiz.attempt_status === "completed" ? "Take again" : "Start quiz"}</Link></article>)}</div></section>}

        {courses.length > 0 && <section className="mt-10"><h2 className="text-2xl font-extrabold uppercase">Courses</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => { const done = Number(course.completed_block_count) >= Number(course.block_count); return <article key={course.course_id} className="border border-black/10 bg-white p-6 shadow-sm"><span className={course.is_required ? "bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-800" : "bg-black/5 px-3 py-1 text-xs font-bold uppercase"}>{course.is_required ? "Required course" : "Optional course"}</span><h3 className="mt-5 text-xl font-extrabold uppercase">{course.title}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-black/55">{course.description || "Internal product training."}</p><p className="mt-5 border-t border-black/10 pt-4 text-sm font-bold">{course.completed_block_count} of {course.block_count} complete</p><Link href={`/m/${brand.slug}/app/courses/${course.course_id}/internal`} className="mt-5 flex min-h-11 items-center justify-center px-4 text-xs font-extrabold uppercase text-white" style={{ backgroundColor: brand.primary_color }}>{done ? "Review course" : course.completed_block_count ? "Continue course" : "Start course"}</Link></article>; })}</div></section>}
      </>}
    </main>
  </div>;
}
