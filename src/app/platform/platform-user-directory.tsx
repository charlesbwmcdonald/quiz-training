"use client";

import { useMemo, useState } from "react";
import PlatformUserControls, { type ManagedPlatformUser } from "./platform-user-controls";

type DirectoryUser=ManagedPlatformUser&{created_at:string;last_sign_in_at:string|null};

export default function PlatformUserDirectory({users,currentUserId}:{users:DirectoryUser[];currentUserId:string}){
  const [query,setQuery]=useState("");
  const [scope,setScope]=useState("all");
  const filtered=useMemo(()=>{const search=query.trim().toLowerCase();return users.filter(user=>{
    const scopeMatch=scope==="all"||(scope==="platform"&&user.platform_owner)||(scope==="manufacturer"&&user.manufacturers.length>0)||(scope==="retailer"&&user.companies.length>0);
    const searchMatch=!search||[user.email,...user.manufacturers.flatMap(item=>[item.name,item.role]),...user.companies.flatMap(item=>[item.name,item.role])].some(value=>value.toLowerCase().includes(search));
    return scopeMatch&&searchMatch;
  })},[query,scope,users]);

  return <div className="mt-5 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
    <div className="sticky top-0 z-20 grid gap-3 border-b border-black/10 bg-[#f7f7f5] p-4 sm:grid-cols-[minmax(240px,1fr)_220px_auto] sm:items-end">
      <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-black/55">Search users<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Email, brand, retailer, or role" className="h-11 rounded-md border border-black/20 bg-white px-4 text-sm font-normal normal-case tracking-normal text-black"/></label>
      <label className="grid gap-2 text-xs font-extrabold uppercase tracking-wide text-black/55">Access type<select value={scope} onChange={event=>setScope(event.target.value)} className="h-11 rounded-md border border-black/20 bg-white px-4 text-sm font-normal normal-case tracking-normal text-black"><option value="all">All users</option><option value="platform">JobberTrain team</option><option value="manufacturer">Manufacturer access</option><option value="retailer">Retailer access</option></select></label>
      <p className="pb-3 text-xs font-extrabold uppercase text-black/40">{filtered.length} of {users.length}</p>
    </div>
    <div className="max-h-[42rem] overflow-y-auto overscroll-contain bg-[#f3f3f1] p-3 sm:p-4">
      <div className="grid gap-4">{filtered.map(user=><article key={user.id} className="overflow-hidden rounded-md border border-black/10 bg-white shadow-sm"><div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><b>{user.email}</b><div className="mt-2 flex flex-wrap gap-2">{user.platform_owner&&<span className="bg-[#ff4f1f]/10 px-2 py-1 text-[10px] font-extrabold uppercase text-[#b92e08]">JobberTrain team</span>}<span className="bg-black/5 px-2 py-1 text-[10px] font-extrabold uppercase text-black/50">{user.manufacturers.length} brand memberships</span><span className="bg-black/5 px-2 py-1 text-[10px] font-extrabold uppercase text-black/50">{user.companies.length} retailer memberships</span></div></div><p className="text-sm text-black/45">Last sign-in {user.last_sign_in_at?new Date(user.last_sign_in_at).toLocaleDateString():"Never"}</p></div><PlatformUserControls user={user} currentUserId={currentUserId}/></article>)}{!filtered.length&&<div className="rounded-md border border-dashed border-black/15 bg-white p-12 text-center"><b className="block uppercase">No users match</b><p className="mt-2 text-sm text-black/45">Try a different email, organization, role, or access type.</p></div>}</div>
    </div>
  </div>;
}
