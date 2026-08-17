"use client";

import { managePlatformUser } from "./actions";

type Membership={id:string;name:string;role:string;status:string};
export type ManagedPlatformUser={id:string;email:string;platform_owner:boolean;manufacturers:Membership[];companies:Membership[]};

function MembershipControl({user,email,scope,membership,currentUserId}:{user:ManagedPlatformUser;email:string;scope:"manufacturer"|"company";membership:Membership;currentUserId:string}){
 const roles=scope==="manufacturer"?["owner","admin","content_manager","viewer"]:["owner","admin","manager","learner"];
 return <div className="grid gap-3 border-t border-black/5 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><b>{membership.name}</b><span className="ml-2 text-xs uppercase text-black/40">{scope}</span></div><div className="flex flex-wrap gap-2"><form action={managePlatformUser} className="flex gap-2"><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="organizationId" value={membership.id}/><input type="hidden" name="action" value="update"/><select name="role" defaultValue={membership.role} className="min-h-9 border bg-white px-2 text-sm capitalize">{roles.map(r=><option key={r} value={r}>{r.replaceAll("_"," ")}</option>)}</select><button className="border-2 border-black px-3 text-xs font-extrabold uppercase">Save</button></form>{user.id!==currentUserId&&<form action={managePlatformUser} onSubmit={e=>{if(!window.confirm(`Remove ${email} from ${membership.name}? Their login and other memberships will remain.`))e.preventDefault()}}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="organizationId" value={membership.id}/><input type="hidden" name="action" value="remove"/><button className="min-h-9 px-2 text-xs font-extrabold uppercase text-red-700">Remove</button></form>}</div></div>;
}

export default function PlatformUserControls({user,currentUserId}:{user:ManagedPlatformUser;currentUserId:string}){
 return <div className="border-t border-black/10 bg-black/[.018]">
  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><span className="text-xs font-extrabold uppercase text-black/45">JobberTrain team</span>{user.platform_owner?(user.id===currentUserId?<span className="text-xs font-bold text-black/40">Current account</span>:<form action={managePlatformUser} onSubmit={e=>{if(!window.confirm(`Remove ${user.email} from the JobberTrain team? Their login and brand memberships will remain.`))e.preventDefault()}}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="scope" value="platform"/><input type="hidden" name="action" value="remove"/><button className="text-xs font-extrabold uppercase text-red-700">Remove platform access</button></form>):<form action={managePlatformUser}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="scope" value="platform"/><input type="hidden" name="action" value="update"/><button className="text-xs font-extrabold uppercase text-[#d93a10]">+ Add to JobberTrain team</button></form>}</div>
  {user.manufacturers.map(m=><MembershipControl key={`m-${m.id}`} user={user} email={user.email} scope="manufacturer" membership={m} currentUserId={currentUserId}/>)}
  {user.companies.map(m=><MembershipControl key={`c-${m.id}`} user={user} email={user.email} scope="company" membership={m} currentUserId={currentUserId}/>)}
 </div>;
}
