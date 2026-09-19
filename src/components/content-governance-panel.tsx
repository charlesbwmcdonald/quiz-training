import { reviewContent, restoreContentVersion } from "@/app/app/content-governance-actions";
import type { ContentReviewEvent, ContentSchedule, ContentVersion } from "@/components/content-governance";
import { ContentScheduleControls } from "@/components/content-schedule-controls";
import { saveContentTemplate } from "@/app/app/templates/actions";

export function ContentGovernancePanel({ contentType, contentId, status, returnTo, canReview, versions, reviews, schedules, message }:{
  contentType:"product"|"quiz"|"course"; contentId:string; status:string; returnTo:string; canReview:boolean;
  versions:ContentVersion[]; reviews:ContentReviewEvent[]; schedules?:ContentSchedule[]; message?:{kind:"error"|"success";text:string};
}) {
  return <section className="mt-6 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
    <div className="border-b border-black/10 px-5 py-4"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-black/40">Governance</p><h2 className="mt-1 text-xl font-extrabold uppercase">Review & version history</h2></div>
    {message&&<div className={`m-5 border-l-4 p-4 text-sm font-semibold ${message.kind==="error"?"border-red-600 bg-red-50 text-red-900":"border-green-700 bg-green-50 text-green-900"}`}>{message.text}</div>}
    {status==="review"&&<div className="border-b border-black/10 bg-blue-50/60 p-5">
      <b className="uppercase text-blue-950">Awaiting review</b>
      <p className="mt-1 text-sm text-blue-950/70">An owner or admin can publish this version or return it with clear revision notes.</p>
      {canReview&&<div className="mt-4 grid gap-3 lg:grid-cols-2">
        <form action={reviewContent} className="rounded-md border border-green-200 bg-white p-4"><input type="hidden" name="contentType" value={contentType}/><input type="hidden" name="contentId" value={contentId}/><input type="hidden" name="returnTo" value={returnTo}/><input type="hidden" name="decision" value="approved"/><label className="text-xs font-extrabold uppercase text-black/45">Approval note <span className="font-normal normal-case">(optional)</span></label><textarea name="note" rows={2} className="mt-2 w-full rounded-md border border-black/15 p-3" placeholder="Ready for learners."/><button className="mt-3 min-h-11 rounded-md bg-green-700 px-5 text-sm font-extrabold uppercase text-white">Approve & publish</button></form>
        <form action={reviewContent} className="rounded-md border border-amber-200 bg-white p-4"><input type="hidden" name="contentType" value={contentType}/><input type="hidden" name="contentId" value={contentId}/><input type="hidden" name="returnTo" value={returnTo}/><input type="hidden" name="decision" value="changes_requested"/><label className="text-xs font-extrabold uppercase text-black/45">Requested changes</label><textarea name="note" rows={2} required className="mt-2 w-full rounded-md border border-black/15 p-3" placeholder="Explain exactly what should be revised."/><button className="mt-3 min-h-11 rounded-md bg-amber-600 px-5 text-sm font-extrabold uppercase text-white">Return to draft</button></form>
      </div>}
    </div>}
    <div className="grid lg:grid-cols-2">
      <div className="border-b border-black/10 p-5 lg:border-b-0 lg:border-r"><h3 className="font-extrabold uppercase">Review activity</h3><div className="mt-3 grid gap-3">{reviews.map((event,index)=><div key={`${event.created_at}-${index}`} className="rounded-md bg-black/[.035] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b className="uppercase">{event.decision.replaceAll("_"," ")}</b><span className="text-black/40">{new Date(event.created_at).toLocaleString()}</span></div><p className="mt-1 text-xs text-black/45">{event.reviewer_email??"Academy reviewer"}</p>{event.note&&<p className="mt-2 text-black/70">{event.note}</p>}</div>)}{!reviews.length&&<p className="text-sm text-black/45">No review decisions recorded yet.</p>}</div></div>
      <div className="p-5"><h3 className="font-extrabold uppercase">Previous versions</h3><p className="mt-1 text-xs text-black/45">Restoring creates a new draft and preserves the current version in history.</p><div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-black/10">{versions.map(version=><div key={version.version_id} className="flex items-center justify-between gap-4 border-b border-black/10 p-3 last:border-0"><div><b className="text-sm">Version {version.version_number}</b><p className="mt-1 text-xs text-black/45">{version.version_status} · {version.actor_email??"System"} · {new Date(version.created_at).toLocaleString()}</p></div><form action={restoreContentVersion}><input type="hidden" name="versionId" value={version.version_id}/><input type="hidden" name="returnTo" value={returnTo}/><button className="min-h-9 rounded-md border border-black/20 px-3 text-xs font-extrabold uppercase">Restore</button></form></div>)}{!versions.length&&<p className="p-4 text-sm text-black/45">Version history begins with the next edit or status change.</p>}</div></div>
    </div>
    {canReview&&status!=="archived"&&<ContentScheduleControls contentType={contentType} contentId={contentId} status={status} returnTo={returnTo} schedules={schedules??[]}/>} 
    <details className="group border-t border-black/10">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 font-extrabold uppercase [&::-webkit-details-marker]:hidden"><span><span className="block text-xs tracking-[.18em] text-black/40">Reuse</span>Save as template</span><span className="text-xs text-black/35 group-open:rotate-180">▼</span></summary>
      <form action={saveContentTemplate} className="grid gap-4 border-t border-black/10 bg-black/[.02] p-5 md:grid-cols-2">
        <input type="hidden" name="contentType" value={contentType}/><input type="hidden" name="contentId" value={contentId}/><input type="hidden" name="returnTo" value={returnTo}/>
        <label className="grid gap-2 text-xs font-extrabold uppercase text-black/45">Template name<input name="templateName" required placeholder="Example: Product launch course" className="min-h-12 rounded-md border border-black/15 bg-white px-4 text-sm font-normal normal-case text-black"/></label>
        <label className="grid gap-2 text-xs font-extrabold uppercase text-black/45">Best used for<input name="templateDescription" placeholder="Explain when your team should use this structure" className="min-h-12 rounded-md border border-black/15 bg-white px-4 text-sm font-normal normal-case text-black"/></label>
        <div className="md:col-span-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="max-w-2xl text-xs leading-5 text-black/45">Copies the complete content structure into your academy template library. Assignments, learner records, and reporting history are excluded.</p><button className="min-h-11 shrink-0 rounded-md bg-black px-5 text-xs font-extrabold uppercase text-white">Save template</button></div>
      </form>
    </details>
  </section>;
}
