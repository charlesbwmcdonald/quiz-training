import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { removeAssignment, saveAssignments } from "./actions";

type Retailer = { company_id: string; company_name: string; member_count: number; assignment_count: number };
type Quiz = { quiz_id: string; title: string; description: string | null; passing_score: number };
type Assignment = { company_id: string; company_name: string; quiz_id: string; quiz_title: string; is_required: boolean; due_at: string | null };

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([supabase.auth.getUser(), getActiveBrand()]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const [{ data: retailers }, { data: quizzes }, { data: assignments }] = await Promise.all([
    supabase.rpc("manufacturer_retailer_dashboard"),
    supabase.rpc("manufacturer_published_quizzes"),
    supabase.rpc("manufacturer_assignments"),
  ]);
  const primary = brand.primary_color;

  return <div className="min-h-screen bg-[#f4f4f2] text-black"><ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <p className="text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: primary }}>Dealer network</p>
      <h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Assign training</h1>
      <p className="mt-3 max-w-2xl text-black/60">Send a published quiz to one or several retailers. Reassigning the same quiz updates its requirements and due date.</p>
      {params.error && <div role="alert" className="mt-6 border-l-4 bg-red-50 p-4 font-semibold text-red-900" style={{ borderColor: primary }}>{params.error}</div>}
      {params.saved && <div role="status" className="mt-6 border-l-4 border-green-600 bg-green-50 p-4 font-semibold text-green-900">Training assigned to {params.saved} retailer{params.saved === "1" ? "" : "s"}.</div>}

      <form action={saveAssignments} className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="border border-black/10 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold uppercase">1. Choose training</h2>
          <label className="mt-5 grid gap-2 font-bold">Published quiz<select name="quizId" required className="min-h-12 border border-black/20 bg-white px-4 font-normal outline-none"><option value="">Select a quiz</option>{(quizzes as Quiz[] ?? []).map(q => <option key={q.quiz_id} value={q.quiz_id}>{q.title}</option>)}</select></label>
          {(quizzes?.length ?? 0) === 0 && <p className="mt-3 text-sm text-amber-800">Publish a quiz before assigning it. <Link href="/app" className="font-bold underline">Go to training</Link></p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 font-bold">Due date <span className="text-xs font-normal text-black/45">Optional</span><input name="dueDate" type="date" className="min-h-12 border border-black/20 px-4 font-normal" /></label><label className="flex min-h-12 items-center gap-3 self-end border border-black/15 px-4 font-bold"><input name="required" type="checkbox" defaultChecked className="h-5 w-5" /> Required training</label></div>
        </section>
        <section className="border border-black/10 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold uppercase">2. Choose retailers</h2><div className="mt-5 grid max-h-72 gap-2 overflow-auto">
          {(retailers as Retailer[] ?? []).map(r => <label key={r.company_id} className="flex items-center justify-between gap-4 border border-black/10 p-4 hover:bg-black/[.02]"><span className="flex items-center gap-3"><input type="checkbox" name="companyIds" value={r.company_id} className="h-5 w-5" /><span><b className="block">{r.company_name}</b><span className="text-xs text-black/45">{r.member_count} member{Number(r.member_count) === 1 ? "" : "s"}</span></span></span><span className="text-xs font-bold text-black/40">{r.assignment_count} assigned</span></label>)}
          {(retailers?.length ?? 0) === 0 && <p className="text-black/55">No retailers are linked to this manufacturer yet.</p>}
        </div><button disabled={!quizzes?.length || !retailers?.length} className="mt-5 min-h-12 w-full px-6 font-extrabold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: primary }}>Assign training</button></section>
      </form>

      <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold uppercase">Current assignments</h2><p className="mt-1 text-sm text-black/55">What is live across your retailer network.</p></div></div>
        <div className="mt-5 overflow-hidden border border-black/10 bg-white shadow-sm">{(assignments?.length ?? 0) === 0 ? <p className="p-6 text-black/55">No training has been assigned yet.</p> : (assignments as Assignment[]).map(a => <div key={`${a.company_id}-${a.quiz_id}`} className="grid gap-3 border-b border-black/10 p-5 last:border-b-0 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"><div><b className="uppercase">{a.quiz_title}</b><p className="text-sm text-black/50">{a.company_name}</p></div><div className="text-sm"><b>{a.is_required ? "Required" : "Optional"}</b><p className="text-black/50">{a.due_at ? `Due ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(a.due_at))}` : "No due date"}</p></div><span className="text-xs font-bold uppercase text-green-700">Active</span><form action={removeAssignment}><input type="hidden" name="companyId" value={a.company_id} /><input type="hidden" name="quizId" value={a.quiz_id} /><button className="text-sm font-bold text-red-700 hover:underline">Remove</button></form></div>)}</div>
      </section>
    </main></div>;
}
