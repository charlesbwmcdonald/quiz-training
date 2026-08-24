"use client";

import {useMemo, useState} from "react";

export type ProgramRetailer = {
  company_id: string;
  company_name: string;
  member_count?: number | null;
  address_line_1?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
};

export default function ProgramRetailerSelector({retailers,initialSelectedIds}:{retailers:ProgramRetailer[];initialSelectedIds:string[]}){
  const[query,setQuery]=useState("");
  const[selectedIds,setSelectedIds]=useState(()=>new Set(initialSelectedIds));
  const visibleRetailers=useMemo(()=>{
    const search=query.trim().toLowerCase();
    return search?retailers.filter(retailer=>[
      retailer.company_name,retailer.address_line_1,retailer.city,retailer.state_region,
      retailer.postal_code,retailer.phone,retailer.contact_name,retailer.contact_email,
    ].some(value=>value?.toLowerCase().includes(search))):retailers;
  },[query,retailers]);
  const visibleIds=visibleRetailers.map(retailer=>retailer.company_id);
  const allVisibleSelected=visibleIds.length>0&&visibleIds.every(id=>selectedIds.has(id));
  const toggleRetailer=(id:string,checked:boolean)=>setSelectedIds(current=>{
    const next=new Set(current);if(checked)next.add(id);else next.delete(id);return next;
  });
  const toggleVisible=(checked:boolean)=>setSelectedIds(current=>{
    const next=new Set(current);visibleIds.forEach(id=>checked?next.add(id):next.delete(id));return next;
  });

  return <>
    {[...selectedIds].map(id=><input key={id} type="hidden" name="companyIds" value={id}/>)}
    <label className="mt-5 grid gap-1 text-xs font-extrabold uppercase tracking-wide text-black/45">Search eligible retailers<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Name, city, state, phone, contact..." className="min-h-11 border border-black/20 px-3 text-sm font-normal normal-case tracking-normal text-black outline-none focus:border-black"/></label>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-black/40">Retailers <span className="ml-2 normal-case tracking-normal">{visibleRetailers.length} shown · {selectedIds.size} selected</span></p>
      {!!visibleRetailers.length&&<label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold uppercase"><input type="checkbox" checked={allVisibleSelected} onChange={event=>toggleVisible(event.target.checked)} className="h-4 w-4"/>Select all shown</label>}
    </div>
    <div className="mt-2 max-h-96 overflow-auto border border-black/10">
      {!!retailers.length&&<div className="sticky top-0 z-10 hidden grid-cols-[32px_minmax(180px,1.2fr)_minmax(180px,1fr)_minmax(180px,1fr)_100px] items-center gap-4 border-b border-black/10 bg-[#f7f7f5] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wide text-black/40 lg:grid"><span/><span>Retailer</span><span>Location</span><span>Contact</span><span>Team</span></div>}
      {visibleRetailers.map(retailer=><label key={retailer.company_id} className="grid cursor-pointer gap-3 border-b border-black/10 p-4 last:border-0 hover:bg-black/[.02] lg:grid-cols-[32px_minmax(180px,1.2fr)_minmax(180px,1fr)_minmax(180px,1fr)_100px] lg:items-center lg:gap-4"><input type="checkbox" checked={selectedIds.has(retailer.company_id)} onChange={event=>toggleRetailer(retailer.company_id,event.target.checked)} className="h-5 w-5"/><div><b className="block uppercase">{retailer.company_name}</b><span className="mt-1 block text-xs text-black/45">Retailer location</span></div><div className="text-sm"><p>{retailer.address_line_1||"Address not added"}</p><p className="text-black/50">{[retailer.city,retailer.state_region,retailer.postal_code].filter(Boolean).join(", ")||"City and state not added"}</p></div><div className="text-sm"><p>{retailer.contact_name||"Contact not added"}</p><p className="text-black/50">{retailer.phone||retailer.contact_email||"Phone or email not added"}</p></div><span className="text-xs font-bold text-black/45">{Number(retailer.member_count??0)} member{Number(retailer.member_count??0)===1?"":"s"}</span></label>)}
      {!visibleRetailers.length&&<p className="p-5 text-sm text-black/50">No retailers match this search. Clear the search to see all eligible retailers.</p>}
    </div>
  </>;
}
