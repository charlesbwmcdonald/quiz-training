"use client";

import { manageMember } from "./actions";

export default function MemberControls({ userId, email, scope, companyId, role, currentUserId }: { userId:string; email:string; scope:"manufacturer"|"retailer"; companyId?:string; role:string; currentUserId:string }) {
  const roles=scope==="manufacturer"?["owner","admin","content_manager","viewer"]:["manager","learner"];
  return <details className="group relative justify-self-end">
    <summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 border-2 border-black px-4 text-xs font-extrabold uppercase marker:content-none hover:bg-black hover:text-white [&::-webkit-details-marker]:hidden">Manage <span aria-hidden="true" className="text-[9px] transition group-open:rotate-180">▼</span></summary>
    <div className="absolute right-0 z-40 mt-2 w-72 border border-black/15 bg-white p-4 text-left shadow-2xl">
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Update role</p>
      <form action={manageMember} className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input type="hidden" name="userId" value={userId}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="companyId" value={companyId??""}/><input type="hidden" name="action" value="update"/>
        <select name="role" defaultValue={role} aria-label={`Role for ${email}`} className="min-h-10 min-w-0 border border-black/20 bg-white px-3 text-sm capitalize">{roles.map((item)=><option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}</select>
        <button className="min-h-10 bg-black px-4 text-xs font-extrabold uppercase text-white">Save</button>
      </form>
      {userId!==currentUserId&&<div className="mt-4 border-t border-black/10 pt-4"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Access</p><form action={manageMember} className="mt-2" onSubmit={(event)=>{if(!window.confirm(`Remove ${email} from this ${scope==="manufacturer"?"brand":"retailer"}? Their login, training history, and other memberships will remain.`))event.preventDefault()}}>
        <input type="hidden" name="userId" value={userId}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="companyId" value={companyId??""}/><input type="hidden" name="action" value="remove"/>
        <button className="w-full border border-red-200 bg-red-50 px-3 py-3 text-left text-xs font-extrabold uppercase text-red-700 hover:bg-red-700 hover:text-white">Remove from {scope==="manufacturer"?"brand":"retailer"}</button>
      </form><p className="mt-2 text-[11px] leading-4 text-black/45">This does not delete their JobberTrain account or training history.</p></div>}
      {userId===currentUserId&&<p className="mt-4 border-t border-black/10 pt-4 text-xs text-black/45">You cannot remove your own access here.</p>}
    </div>
  </details>;
}
