"use client";

import { useState } from "react";
import { cancelContentSchedule, scheduleContentAction } from "@/app/app/content-governance-actions";
import type { ContentSchedule } from "@/components/content-governance";

export function ContentScheduleControls({contentType,contentId,status,returnTo,schedules}:{contentType:"product"|"quiz"|"course";contentId:string;status:string;returnTo:string;schedules:ContentSchedule[]}){
  const [localValue,setLocalValue]=useState("");
  const pending=schedules.filter(item=>item.schedule_status==="pending");
  // This is a client-side convenience; the server remains the source of truth for validation.
  // eslint-disable-next-line react-hooks/purity
  const minimum=new Date(Date.now()+2*60*1000); minimum.setSeconds(0,0);
  const minLocal=new Date(minimum.getTime()-minimum.getTimezoneOffset()*60000).toISOString().slice(0,16);
  return <div className="border-t border-black/10 p-5"><h3 className="font-extrabold uppercase">Scheduling</h3><p className="mt-1 text-sm text-black/45">Scheduled actions run automatically within about one minute of the selected time.</p>
    <div className="mt-4 grid gap-3">{pending.map(item=><div key={item.schedule_id} className="flex flex-col justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center"><div><b className="text-sm uppercase">Scheduled to {item.schedule_action}</b><p className="mt-1 text-xs text-black/50">{new Date(item.execute_at).toLocaleString()} · {item.created_by_email??"Academy administrator"}</p></div><form action={cancelContentSchedule}><input type="hidden" name="scheduleId" value={item.schedule_id}/><input type="hidden" name="returnTo" value={returnTo}/><button className="min-h-9 rounded-md border border-black/20 bg-white px-3 text-xs font-extrabold uppercase">Cancel</button></form></div>)}</div>
    <form action={scheduleContentAction} className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end"><input type="hidden" name="contentType" value={contentType}/><input type="hidden" name="contentId" value={contentId}/><input type="hidden" name="returnTo" value={returnTo}/><input type="hidden" name="scheduledForIso" value={localValue?new Date(localValue).toISOString():""}/><label className="grid gap-2 text-xs font-extrabold uppercase text-black/45">Action<select name="scheduleAction" className="min-h-11 rounded-md border border-black/15 bg-white px-3 text-sm text-black"><option value="archive">Archive</option>{status==="review"&&<option value="publish">Publish</option>}</select></label><label className="grid gap-2 text-xs font-extrabold uppercase text-black/45">Local date & time<input type="datetime-local" required min={minLocal} value={localValue} onChange={event=>setLocalValue(event.target.value)} className="min-h-11 rounded-md border border-black/15 px-3 text-sm font-normal text-black"/></label><button disabled={!localValue} className="academy-filter-button min-h-11 px-5 text-xs font-extrabold uppercase disabled:opacity-35">Schedule</button></form>
    {status!=="review"&&<p className="mt-2 text-xs text-black/40">Move content to Review before scheduling publication. Archiving may be scheduled from any active state.</p>}
  </div>;
}
