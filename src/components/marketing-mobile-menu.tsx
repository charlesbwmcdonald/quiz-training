"use client";

import Link from "next/link";
import {useEffect, useState} from "react";

const links = [
  ["How it works", "/#how-it-works"],
  ["Features", "/#features"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
];

export function MarketingMobileMenu() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[]);
  return <div className="relative z-50 md:hidden">
    {open&&<button type="button" aria-label="Close navigation menu" onClick={()=>setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-black/20"/>}
    <button type="button" aria-label={open?"Close navigation menu":"Open navigation menu"} aria-expanded={open} onClick={()=>setOpen(value=>!value)} className={`relative z-[60] grid h-11 w-11 place-items-center border transition ${open?"border-[#ff4f1f] bg-[#ff4f1f]":"border-black/20 bg-white/40 hover:border-black/45 hover:bg-white"}`}>
      <span className="grid gap-1.5" aria-hidden="true"><span className={`block h-0.5 w-5 transition ${open?"translate-y-2 rotate-45 bg-white":"bg-black"}`}/><span className={`block h-0.5 w-5 transition ${open?"bg-white opacity-0":"bg-black"}`}/><span className={`block h-0.5 w-5 transition ${open?"-translate-y-2 -rotate-45 bg-white":"bg-black"}`}/></span>
    </button>
    {open&&<nav className="fixed inset-x-0 top-[76px] z-[60] w-full border-b border-black/10 border-t-4 border-t-[#ff4f1f] bg-white p-2 shadow-2xl" aria-label="Mobile navigation">
      {links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="block border-b border-black/10 px-4 py-4 text-sm font-extrabold uppercase tracking-[.1em] hover:bg-black/[.04]">{label}</Link>)}
      <Link href="/login?next=/platform" onClick={()=>setOpen(false)} className="mt-2 block px-4 py-4 text-sm font-extrabold uppercase tracking-[.1em]">Sign in</Link>
      <Link href="/contact" onClick={()=>setOpen(false)} className="block bg-[#ff4f1f] px-4 py-4 text-center text-sm font-extrabold uppercase tracking-[.1em] text-white">Discuss a pilot</Link>
    </nav>}
  </div>;
}
