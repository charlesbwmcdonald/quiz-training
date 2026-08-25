"use client";

import {useEffect,useRef,useState} from "react";
import {useFormStatus} from "react-dom";
import {academyButton} from "@/components/academy-ui";

export function BrandStudioSaveBar({primary,initiallySaved=false}:{primary:string;initiallySaved?:boolean}){
  const ref=useRef<HTMLDivElement>(null);
  const[dirty,setDirty]=useState(false);
  const{pending}=useFormStatus();
  useEffect(()=>{
    const form=ref.current?.closest("form");
    if(!form)return;
    const markDirty=()=>setDirty(true);
    form.addEventListener("input",markDirty);
    form.addEventListener("change",markDirty);
    return()=>{form.removeEventListener("input",markDirty);form.removeEventListener("change",markDirty)};
  },[]);
  return <div ref={ref} className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-black/10 bg-white/95 p-3 shadow-[0_16px_40px_rgba(16,16,16,.16)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2 px-1"><span className={`h-2.5 w-2.5 rounded-full ${pending?"animate-pulse bg-amber-500":dirty?"bg-amber-500":"bg-green-600"}`}/><p className="text-xs font-bold text-black/55">{pending?"Saving changes…":dirty?"You have unsaved changes":initiallySaved?"Changes saved":"Ready to edit"}</p></div>
    <div className="flex flex-wrap justify-end gap-2"><button name="intent" value="draft" disabled={pending} className={`${academyButton.secondary} disabled:opacity-50`}>Save Draft</button><button name="intent" value="publish" disabled={pending} className={`${academyButton.primary} disabled:opacity-50`} style={{backgroundColor:primary}}>Publish Landing Page</button></div>
  </div>;
}
