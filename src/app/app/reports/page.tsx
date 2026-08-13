import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Summary = { retailers: number; learners: number; assigned: number; completed: number; completion_rate: number; pass_rate: number };
type QuizStat = { quiz_id: string; title: string; assigned_retailers: number; assigned_learners: number; completed: number; average_score: number; passed: number };
type RetailerStat = { company_id: string; company_name: string; learners: number; assigned_quizzes: number; completed: number; average_score: number; passed: number };
type Recent = { learner_email: string; company_name: string; quiz_title: string; score: number; passed: boolean; submitted_at: string };
type Report = { summary: Summary; quizzes: QuizStat[]; retailers: RetailerStat[]; recent: Recent[] };

function RateBar({ value, color }: { value: number; color: string }) {
  return <div className="mt-2 h-2 overflow-hidden bg-black/10"><div className="h-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} /></div>;
}

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([supabase.auth.getUser(), getActiveBrand()]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_view_reports) redirect("/app");
  const { data, error } = await supabase.rpc("manufacturer_training_report");
  const report = data as Report | null;
  const summary = report?.summary ?? { retailers: 0, learners: 0, assigned: 0, completed: 0, completion_rate: 0, pass_rate: 0 };
  const primary = brand.primary_color;

  return <div className="min-h-screen bg-[#f4f4f2] text-black"><ManufacturerHeader brand={brand} email={auth.user.email} /><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
    <p className="text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: primary }}>Network performance</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Training reports</h1><p className="mt-3 max-w-2xl text-black/60">Measure retailer participation, product knowledge, and the training that needs attention.</p>
    {error && <div className="mt-7 border-l-4 bg-red-50 p-4 font-semibold text-red-900" style={{ borderColor: primary }}>Reports are temporarily unavailable.</div>}

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="border border-black/10 bg-white p-5 shadow-sm"><span className="text-xs font-extrabold uppercase tracking-wide text-black/45">Retailers</span><b className="mt-2 block text-4xl">{summary.retailers}</b><p className="mt-1 text-sm text-black/50">{summary.learners} active learners</p></article>
      <article className="border border-black/10 bg-white p-5 shadow-sm"><span className="text-xs font-extrabold uppercase tracking-wide text-black/45">Completion rate</span><b className="mt-2 block text-4xl">{summary.completion_rate}%</b><RateBar value={summary.completion_rate} color={primary} /><p className="mt-2 text-sm text-black/50">{summary.completed} of {summary.assigned} learner assignments</p></article>
      <article className="border border-black/10 bg-white p-5 shadow-sm"><span className="text-xs font-extrabold uppercase tracking-wide text-black/45">Pass rate</span><b className="mt-2 block text-4xl">{summary.pass_rate}%</b><RateBar value={summary.pass_rate} color="#15803d" /><p className="mt-2 text-sm text-black/50">Latest completed attempts</p></article>
      <article className="p-5 text-white shadow-sm" style={{ backgroundColor: brand.secondary_color }}><span className="text-xs font-extrabold uppercase tracking-wide text-white/55">Outstanding</span><b className="mt-2 block text-4xl">{Math.max(0, summary.assigned - summary.completed)}</b><p className="mt-1 text-sm text-white/60">Assignments still to complete</p></article>
    </section>

    <div className="mt-10 grid gap-7 xl:grid-cols-2">
      <section><h2 className="text-2xl font-extrabold uppercase">By quiz</h2><div className="mt-4 overflow-hidden border border-black/10 bg-white shadow-sm">{(report?.quizzes.length ?? 0) === 0 ? <p className="p-6 text-black/50">No assigned quizzes yet.</p> : report!.quizzes.map(item => { const completion = item.assigned_learners ? Math.round(item.completed / item.assigned_learners * 100) : 0; return <div key={item.quiz_id} className="border-b border-black/10 p-5 last:border-0"><div className="flex items-start justify-between gap-4"><div><b className="uppercase">{item.title}</b><p className="mt-1 text-sm text-black/45">{item.assigned_retailers} retailers · {item.assigned_learners} learners</p></div><div className="text-right"><b className="text-xl">{item.average_score}%</b><p className="text-xs uppercase text-black/40">Avg. score</p></div></div><div className="mt-4 flex justify-between text-xs font-bold uppercase"><span>Completion</span><span>{completion}%</span></div><RateBar value={completion} color={primary} /></div>})}</div></section>
      <section><h2 className="text-2xl font-extrabold uppercase">By retailer</h2><div className="mt-4 overflow-hidden border border-black/10 bg-white shadow-sm">{(report?.retailers.length ?? 0) === 0 ? <p className="p-6 text-black/50">No connected retailers yet.</p> : report!.retailers.map(item => { const expected = item.learners * item.assigned_quizzes; const completion = expected ? Math.round(item.completed / expected * 100) : 0; return <div key={item.company_id} className="grid gap-3 border-b border-black/10 p-5 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><b className="uppercase">{item.company_name}</b><p className="mt-1 text-sm text-black/45">{item.learners} learners · {item.assigned_quizzes} quizzes</p></div><div className="sm:text-right"><b className="text-xl">{completion}%</b><p className="text-xs uppercase text-black/40">Complete</p></div><div className="sm:text-right"><b className="text-xl">{item.average_score}%</b><p className="text-xs uppercase text-black/40">Avg. score</p></div></div>})}</div></section>
    </div>

    <section className="mt-10"><h2 className="text-2xl font-extrabold uppercase">Recent results</h2><div className="mt-4 overflow-x-auto border border-black/10 bg-white shadow-sm"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-black/10 bg-black/[.03] text-xs uppercase tracking-wide text-black/45"><tr><th className="p-4">Learner</th><th className="p-4">Retailer</th><th className="p-4">Quiz</th><th className="p-4">Score</th><th className="p-4">Result</th><th className="p-4">Completed</th></tr></thead><tbody>{(report?.recent.length ?? 0) === 0 ? <tr><td colSpan={6} className="p-6 text-center text-black/50">No completed training yet.</td></tr> : report!.recent.map((item, index) => <tr key={`${item.learner_email}-${item.quiz_title}-${index}`} className="border-b border-black/10 last:border-0"><td className="p-4 font-semibold">{item.learner_email}</td><td className="p-4">{item.company_name}</td><td className="p-4">{item.quiz_title}</td><td className="p-4 font-bold">{item.score}%</td><td className="p-4"><span className={item.passed ? "bg-green-100 px-2 py-1 text-xs font-bold uppercase text-green-800" : "bg-red-100 px-2 py-1 text-xs font-bold uppercase text-red-800"}>{item.passed ? "Passed" : "Needs retry"}</span></td><td className="p-4 text-black/50">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(item.submitted_at))}</td></tr>)}</tbody></table></div></section>
  </main></div>;
}
