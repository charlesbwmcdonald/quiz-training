import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InternalCourse = { course_id:string; title:string; description:string|null; is_required:boolean; due_at:string|null; block_count:number; completed_block_count:number };
type RetailerCourse = { company_id:string; company_name:string; course_id:string; title:string; description:string|null; is_required:boolean; due_at:string|null; block_count:number; completed_blocks:number };
type InternalQuiz = { quiz_id:string; title:string; description:string|null; passing_score:number; is_required:boolean; due_at:string|null; attempt_status:string|null; latest_score:number|null };
type RetailerQuiz = { company_id:string; company_name:string; quiz_id:string; quiz_title:string; quiz_description:string|null; passing_score:number; is_required:boolean; due_at:string|null; attempt_status:string|null; latest_score:number|null };
type TrainingStatus = "assigned" | "in_progress" | "completed" | "overdue";
type TrainingItem = {
  key:string; kind:"Course"|"Quiz"; title:string; description:string; source:string; required:boolean; dueAt:string|null;
  status:TrainingStatus; progress:number; progressLabel:string; result?:string; href:string; action:string;
};
type Filter = "all" | TrainingStatus;

const filters: { value:Filter; label:string }[] = [
  { value:"all", label:"All" },
  { value:"assigned", label:"Assigned" },
  { value:"in_progress", label:"In Progress" },
  { value:"completed", label:"Completed" },
  { value:"overdue", label:"Overdue" },
];

function trainingStatus(completed:boolean, inProgress:boolean, dueAt:string|null, now:number):TrainingStatus {
  if (completed) return "completed";
  if (dueAt && new Date(dueAt).getTime() < now) return "overdue";
  return inProgress ? "in_progress" : "assigned";
}

function statusStyles(status:TrainingStatus) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "overdue") return "bg-red-100 text-red-800";
  if (status === "in_progress") return "bg-blue-100 text-blue-800";
  return "bg-black/5 text-black/60";
}

function statusLabel(status:TrainingStatus) {
  return status === "in_progress" ? "In progress" : status;
}

export default async function MyTrainingPage({ searchParams }:{ searchParams:Promise<{ filter?:string }> }) {
  const query = await searchParams;
  const activeFilter:Filter = filters.some((filter) => filter.value === query.filter) ? query.filter as Filter : "all";
  const supabase = await createSupabaseServerClient();
  const [{ data:auth }, brand, { data:internalCourseRows }, { data:internalQuizRows }, { data:retailerCourseRows }, { data:retailerQuizRows }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("internal_team_courses"),
    supabase.rpc("internal_team_quizzes"),
    supabase.rpc("learner_courses"),
    supabase.rpc("learner_training_dashboard"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand) redirect("/app");

  const now = Date.now();
  const items:TrainingItem[] = [];
  for (const course of (internalCourseRows ?? []) as InternalCourse[]) {
    const blockCount = Number(course.block_count);
    const completedBlocks = Number(course.completed_block_count);
    const completed = blockCount > 0 && completedBlocks >= blockCount;
    const progress = blockCount ? Math.min(100, Math.round(completedBlocks / blockCount * 100)) : 0;
    const status = trainingStatus(completed, completedBlocks > 0, course.due_at, now);
    items.push({ key:`internal-course-${course.course_id}`, kind:"Course", title:course.title, description:course.description || "Product training course.", source:`${brand.name} team`, required:course.is_required, dueAt:course.due_at, status, progress, progressLabel:`${completedBlocks} of ${blockCount} lessons`, href:`/m/${brand.slug}/app/courses/${course.course_id}/internal`, action:completed ? "Review" : completedBlocks ? "Continue" : "Start" });
  }
  for (const course of (retailerCourseRows ?? []) as RetailerCourse[]) {
    const blockCount = Number(course.block_count);
    const completedBlocks = Number(course.completed_blocks);
    const completed = blockCount > 0 && completedBlocks >= blockCount;
    const progress = blockCount ? Math.min(100, Math.round(completedBlocks / blockCount * 100)) : 0;
    const status = trainingStatus(completed, completedBlocks > 0, course.due_at, now);
    items.push({ key:`retailer-course-${course.company_id}-${course.course_id}`, kind:"Course", title:course.title, description:course.description || "Product training course.", source:course.company_name, required:course.is_required, dueAt:course.due_at, status, progress, progressLabel:`${completedBlocks} of ${blockCount} lessons`, href:`/m/${brand.slug}/app/learning/${course.company_id}/${course.course_id}`, action:completed ? "Review" : completedBlocks ? "Continue" : "Start" });
  }
  for (const quiz of (internalQuizRows ?? []) as InternalQuiz[]) {
    const score = quiz.latest_score === null ? null : Number(quiz.latest_score);
    const attempted = quiz.attempt_status === "completed";
    const completed = attempted && score !== null && score >= quiz.passing_score;
    const inProgress = quiz.attempt_status === "in_progress";
    const status = trainingStatus(completed, inProgress, quiz.due_at, now);
    items.push({ key:`internal-quiz-${quiz.quiz_id}`, kind:"Quiz", title:quiz.title, description:quiz.description || "Product knowledge check.", source:`${brand.name} team`, required:quiz.is_required, dueAt:quiz.due_at, status, progress:completed ? 100 : inProgress ? 50 : 0, progressLabel:score === null ? `${quiz.passing_score}% to pass` : `Latest score: ${score}%`, result:completed ? "Passed" : attempted ? "Retry needed" : undefined, href:`/m/${brand.slug}/app/training/internal/${quiz.quiz_id}`, action:completed ? "Take again" : attempted ? "Retry" : inProgress ? "Continue" : "Start" });
  }
  for (const quiz of (retailerQuizRows ?? []) as RetailerQuiz[]) {
    const score = quiz.latest_score === null ? null : Number(quiz.latest_score);
    const attempted = quiz.attempt_status === "completed";
    const completed = attempted && score !== null && score >= quiz.passing_score;
    const inProgress = quiz.attempt_status === "in_progress";
    const status = trainingStatus(completed, inProgress, quiz.due_at, now);
    items.push({ key:`retailer-quiz-${quiz.company_id}-${quiz.quiz_id}`, kind:"Quiz", title:quiz.quiz_title, description:quiz.quiz_description || "Product knowledge check.", source:quiz.company_name, required:quiz.is_required, dueAt:quiz.due_at, status, progress:completed ? 100 : inProgress ? 50 : 0, progressLabel:score === null ? `${quiz.passing_score}% to pass` : `Latest score: ${score}%`, result:completed ? "Passed" : attempted ? "Retry needed" : undefined, href:`/m/${brand.slug}/app/training/${quiz.company_id}/${quiz.quiz_id}`, action:completed ? "Take again" : attempted ? "Retry" : inProgress ? "Continue" : "Start" });
  }

  const priority:Record<TrainingStatus,number> = { overdue:0, in_progress:1, assigned:2, completed:3 };
  items.sort((a,b) => priority[a.status] - priority[b.status] || (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity) || a.title.localeCompare(b.title));
  const visible = activeFilter === "all" ? items : items.filter((item) => item.status === activeFilter);
  const counts = { assigned:items.filter((item) => item.status === "assigned").length, in_progress:items.filter((item) => item.status === "in_progress").length, completed:items.filter((item) => item.status === "completed").length, overdue:items.filter((item) => item.status === "overdue").length };
  const basePath = `/m/${brand.slug}/app/my-training`;

  return <div className="min-h-screen bg-[#f4f4f2]"><ManufacturerHeader brand={brand} email={auth.user.email}/><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
    <p className="text-sm font-extrabold uppercase italic tracking-[.2em]" style={{color:brand.primary_color}}>{brand.name} learning</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">My Training</h1><p className="mt-3 max-w-2xl text-black/60">Your assigned courses and quizzes, progress, due dates, and completed training in one place.</p>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="border border-black/10 bg-white p-5 shadow-sm"><span className="text-xs font-extrabold uppercase tracking-wide text-black/45">Assigned</span><b className="mt-2 block text-4xl">{counts.assigned}</b><p className="mt-1 text-sm text-black/50">Ready to begin</p></article>
      <article className="border border-black/10 bg-white p-5 shadow-sm"><span className="text-xs font-extrabold uppercase tracking-wide text-black/45">In progress</span><b className="mt-2 block text-4xl">{counts.in_progress}</b><p className="mt-1 text-sm text-black/50">Continue where you left off</p></article>
      <article className="border border-black/10 bg-white p-5 shadow-sm"><span className="text-xs font-extrabold uppercase tracking-wide text-black/45">Completed</span><b className="mt-2 block text-4xl">{counts.completed}</b><p className="mt-1 text-sm text-black/50">Available to review</p></article>
      <article className={counts.overdue ? "bg-red-800 p-5 text-white shadow-sm" : "p-5 text-white shadow-sm"} style={counts.overdue ? undefined : {backgroundColor:brand.secondary_color}}><span className="text-xs font-extrabold uppercase tracking-wide text-white/60">Overdue</span><b className="mt-2 block text-4xl">{counts.overdue}</b><p className="mt-1 text-sm text-white/65">{counts.overdue ? "Needs your attention" : "Nothing overdue"}</p></article>
    </section>

    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Training status filters">{filters.map((filter) => { const count = filter.value === "all" ? items.length : counts[filter.value]; const selected = activeFilter === filter.value; return <Link key={filter.value} href={filter.value === "all" ? basePath : `${basePath}?filter=${filter.value}`} aria-current={selected ? "page" : undefined} className={selected ? "inline-flex min-h-11 items-center gap-2 bg-black px-4 text-xs font-extrabold uppercase tracking-wide text-white" : "inline-flex min-h-11 items-center gap-2 border border-black/15 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-black/55 hover:border-black hover:text-black"}><span>{filter.label}</span><span className={selected ? "text-white/55" : "text-black/35"}>{count}</span></Link> })}</nav>

    <section className="mt-5 overflow-hidden border border-black/10 bg-white shadow-sm"><div className="hidden grid-cols-[minmax(0,1.5fr)_90px_150px_190px_130px_110px_110px] items-center gap-5 border-b border-black/10 bg-black/[.03] px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-black/45 lg:grid"><span>Training</span><span>Type</span><span>Assigned by</span><span>Progress</span><span>Due date</span><span>Status</span><span className="justify-self-end">Action</span></div>
      {visible.map((item) => <article key={item.key} className="grid min-h-24 gap-4 border-b border-black/10 px-5 py-5 last:border-0 lg:grid-cols-[minmax(0,1.5fr)_90px_150px_190px_130px_110px_110px] lg:items-center lg:gap-5">
        <div className="min-w-0"><b className="block uppercase">{item.title}</b><p className="mt-1 line-clamp-2 text-sm text-black/45">{item.description}</p>{item.required && <span className="mt-2 inline-flex text-[10px] font-extrabold uppercase text-red-700">Required</span>}</div>
        <div><span className="mr-2 text-[10px] font-extrabold uppercase text-black/35 lg:hidden">Type</span><span className="text-xs font-bold uppercase">{item.kind}</span></div>
        <div className="text-sm"><span className="mr-2 text-[10px] font-extrabold uppercase text-black/35 lg:hidden">Assigned by</span>{item.source}</div>
        <div><div className="flex justify-between text-xs font-bold"><span>{item.progressLabel}</span><span className="text-black/35">{item.progress}%</span></div><div className="mt-2 h-2 overflow-hidden bg-black/10"><div className="h-full transition-all" style={{width:`${item.progress}%`,backgroundColor:item.status === "completed" ? "#15803d" : brand.primary_color}}/></div>{item.result && <p className={item.result === "Passed" ? "mt-1 text-xs font-bold text-green-700" : "mt-1 text-xs font-bold text-red-700"}>{item.result}</p>}</div>
        <div className={item.status === "overdue" ? "text-sm font-bold text-red-700" : "text-sm text-black/55"}><span className="mr-2 text-[10px] font-extrabold uppercase text-black/35 lg:hidden">Due</span>{item.dueAt ? new Intl.DateTimeFormat("en-US",{dateStyle:"medium"}).format(new Date(item.dueAt)) : "No due date"}</div>
        <div><span className={`inline-flex px-2 py-1 text-[10px] font-extrabold uppercase ${statusStyles(item.status)}`}>{statusLabel(item.status)}</span></div>
        <Link href={item.href} className="inline-flex min-h-11 items-center justify-center px-4 text-xs font-extrabold uppercase text-white transition hover:brightness-90 lg:justify-self-end" style={{backgroundColor:brand.primary_color}}>{item.action}</Link>
      </article>)}
      {!visible.length && <div className="grid min-h-56 place-items-center p-8 text-center"><div><h2 className="text-xl font-extrabold uppercase">{items.length ? `No ${filters.find((filter) => filter.value === activeFilter)?.label.toLowerCase()} training` : "You're all caught up"}</h2><p className="mt-2 text-black/50">{items.length ? "Choose another status to see your training." : `There is no ${brand.name} training assigned right now.`}</p></div></div>}
    </section>
  </main></div>;
}
