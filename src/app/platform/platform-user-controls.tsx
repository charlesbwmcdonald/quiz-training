"use client";

import { managePlatformUser } from "./actions";

type Membership={id:string;name:string;role:string;status:string};
export type ManagedPlatformUser={id:string;email:string;platform_owner:boolean;manufacturers:Membership[];companies:Membership[]};

const controlButton="flex min-h-10 w-32 items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-black px-4 text-xs font-extrabold uppercase transition hover:bg-black hover:text-white";

function MembershipControl({user,email,scope,membership,currentUserId}:{user:ManagedPlatformUser;email:string;scope:"manufacturer"|"company";membership:Membership;currentUserId:string}){
 const roles=scope==="manufacturer"?["owner","admin","content_manager","viewer"]:["owner","admin","manager","learner"];
 return <details className="group border-t border-black/5 bg-white/60">
  <summary className="grid min-h-16 cursor-pointer list-none gap-3 px-5 py-4 marker:content-none sm:grid-cols-[minmax(0,1fr)_140px_132px] sm:items-center [&::-webkit-details-marker]:hidden">
   <span className="min-w-0"><b className="block truncate">{membership.name}</b><span className="mt-1 block text-[10px] font-extrabold uppercase tracking-wide text-black/35">{scope==="manufacturer"?"Manufacturer academy":"Retailer organization"}</span></span>
   <span className="text-sm font-semibold capitalize">{membership.role.replaceAll("_"," ")}</span>
   <span className={`${controlButton} justify-self-start group-open:bg-black group-open:text-white sm:justify-self-end`}>Manage <span aria-hidden="true" className="text-[9px] transition group-open:rotate-180">▼</span></span>
  </summary>
  <div className="grid gap-5 border-t border-black/10 bg-[#f7f7f5] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.75fr)]">
   <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Update role</p><form action={managePlatformUser} className="mt-3 flex max-w-md gap-2"><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="organizationId" value={membership.id}/><input type="hidden" name="action" value="update"/><select name="role" defaultValue={membership.role} className="min-h-11 min-w-0 flex-1 rounded-md border border-black/20 bg-white px-3 text-sm capitalize">{roles.map(role=><option key={role} value={role}>{role.replaceAll("_"," ")}</option>)}</select><button className="min-h-11 rounded-md bg-black px-5 text-xs font-extrabold uppercase text-white">Save role</button></form></div>
   {user.id!==currentUserId?<div className="border-black/10 lg:border-l lg:pl-5"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-black/40">Remove access</p><p className="mt-2 text-xs leading-5 text-black/50">Removes only this membership. The account and other access remain active.</p><form action={managePlatformUser} className="mt-3" onSubmit={event=>{if(!window.confirm(`Remove ${email} from ${membership.name}? Their login and other memberships will remain.`))event.preventDefault()}}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="organizationId" value={membership.id}/><input type="hidden" name="action" value="remove"/><button className="min-h-11 rounded-md border border-red-200 bg-red-50 px-4 text-xs font-extrabold uppercase text-red-700 hover:bg-red-700 hover:text-white">Remove this access</button></form></div>:<p className="self-center text-sm text-black/45">You cannot remove your own access here.</p>}
  </div>
 </details>;
}

export default function PlatformUserControls({user,currentUserId}:{user:ManagedPlatformUser;currentUserId:string}){
 const memberships=user.manufacturers.length+user.companies.length;
 if(!memberships)return null;
 return <div className="border-t border-black/10 bg-black/[.018]">{user.manufacturers.map(membership=><MembershipControl key={`m-${membership.id}`} user={user} email={user.email} scope="manufacturer" membership={membership} currentUserId={currentUserId}/>)}{user.companies.map(membership=><MembershipControl key={`c-${membership.id}`} user={user} email={user.email} scope="company" membership={membership} currentUserId={currentUserId}/>)}</div>;
}
