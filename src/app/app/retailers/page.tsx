import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Retailer = { company_id: string; company_name: string; member_count: number; assignment_count: number };

export default async function RetailersPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([supabase.auth.getUser(), getActiveBrand()]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const { data } = await supabase.rpc("manufacturer_retailer_dashboard");
  const retailers = (data ?? []) as Retailer[];
  return <div className="min-h-screen bg-[#f4f4f2] text-black"><ManufacturerHeader brand={brand} email={auth.user.email} /><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: brand.primary_color }}>Dealer network</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Retailers</h1><p className="mt-3 text-black/60">See every retailer connected to {brand.name} and their training activity.</p></div><Link href="/app/assignments" className="inline-flex min-h-12 items-center justify-center px-6 font-extrabold uppercase tracking-wide text-white" style={{ backgroundColor: brand.primary_color }}>Assign training</Link></div>
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{retailers.map(r => <article key={r.company_id} className="border border-black/10 bg-white p-6 shadow-sm"><div className="grid h-12 w-12 place-items-center text-lg font-black text-white" style={{ backgroundColor: brand.secondary_color }}>{r.company_name.slice(0,2).toUpperCase()}</div><h2 className="mt-5 text-xl font-extrabold uppercase">{r.company_name}</h2><div className="mt-6 grid grid-cols-2 border-t border-black/10 pt-4"><div><b className="block text-2xl">{r.member_count}</b><span className="text-xs uppercase text-black/45">Members</span></div><div><b className="block text-2xl">{r.assignment_count}</b><span className="text-xs uppercase text-black/45">Assignments</span></div></div></article>)}{retailers.length === 0 && <div className="col-span-full border-2 border-dashed border-black/15 bg-white p-10 text-center text-black/55">No retailers are linked yet.</div>}</div>
  </main></div>;
}
