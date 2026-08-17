import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAcademyDirectory } from "@/lib/academies";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { switchAcademy } from "./actions";

export const dynamic="force-dynamic";

export default async function AcademiesPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const query=await searchParams;
  const supabase=await createSupabaseServerClient();
  const {data:auth}=await supabase.auth.getUser();
  if(!auth.user) redirect("/login?next=/academies");
  const directory=await getAcademyDirectory();
  return <div className="min-h-screen bg-[#f3f3f1] text-black">
    <header className="border-b border-white/10 bg-[#171717] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"><Link href="/academies" className="text-2xl font-black uppercase tracking-[-.05em]">Jobber<span className="text-[#ff4f1f]">Train</span></Link><div className="flex items-center gap-5"><span className="hidden max-w-64 truncate text-sm text-white/50 sm:block">{auth.user.email}</span><form action="/logout" method="post"><button className="text-sm font-extrabold uppercase text-white/70 hover:text-white">Sign out</button></form></div></div></header>
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <p className="text-sm font-extrabold uppercase tracking-[.2em] text-[#d93a10]">Your training network</p><h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">My Academies</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-black/55">Choose a manufacturer academy to continue learning. Your account and training history stay with you as you move between academies.</p>
      {query.error&&<div role="alert" className="mt-7 border-l-4 border-red-700 bg-red-50 p-4 font-semibold text-red-900">{query.error}</div>}
      {directory.academies.length?<section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{directory.academies.map(academy=><article key={academy.id} className="flex min-h-72 flex-col border border-black/10 bg-white p-7 shadow-sm"><div className="flex min-h-14 items-start justify-between gap-5">{academy.logo_url?<Image src={academy.logo_url} alt={`${academy.name} logo`} width={180} height={52} className="max-h-13 w-auto object-contain" unoptimized/>:<h2 className="text-2xl font-black uppercase">{academy.name}</h2>}{academy.is_active&&<span className="px-2 py-1 text-[10px] font-extrabold uppercase text-white" style={{backgroundColor:academy.primary_color}}>Last used</span>}</div><div className="mt-auto border-t border-black/10 pt-6"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-black/40">{academy.access_type.replaceAll("_"," ")} access</p><form action={switchAcademy} className="mt-4"><input type="hidden" name="academyId" value={academy.id}/><button className="min-h-12 w-full px-5 text-sm font-extrabold uppercase text-white transition hover:brightness-90" style={{backgroundColor:academy.primary_color}}>Enter {academy.name} Academy</button></form></div></article>)}</section>:<section className="mt-10 border-2 border-dashed border-black/15 bg-white p-10 text-center"><h2 className="text-2xl font-black uppercase">No academies yet</h2><p className="mt-3 text-black/55">An academy will appear here after a manufacturer or retailer administrator invites you.</p></section>}
      <section className="mt-14"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-black/40">Private invitations</p><h2 className="mt-2 text-3xl font-black uppercase">Available Academies</h2><p className="mt-3 text-black/55">Only academies that invited your email address appear here.</p>{directory.invitations.length?<div className="mt-6 grid gap-4 md:grid-cols-2">{directory.invitations.map(invite=><article key={invite.invitation_id} className="flex flex-col justify-between gap-6 border border-black/10 bg-white p-6 sm:flex-row sm:items-center"><div className="flex items-center gap-4">{invite.logo_url&&<Image src={invite.logo_url} alt="" width={110} height={38} className="max-h-9 w-auto object-contain" unoptimized/>}<div><h3 className="font-extrabold uppercase">{invite.name} Academy</h3><p className="mt-1 text-sm text-black/45">Invited as {invite.role.replaceAll("_"," ")}</p></div></div><Link href={`/invite/${invite.invitation_id}/accept`} className="grid min-h-11 place-items-center px-5 text-sm font-extrabold uppercase text-white" style={{backgroundColor:invite.primary_color}}>Accept invitation</Link></article>)}</div>:<div className="mt-6 border border-black/10 bg-white p-6 text-black/45">You have no pending academy invitations.</div>}</section>
    </main>
  </div>;
}
