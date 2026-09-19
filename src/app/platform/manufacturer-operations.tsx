"use client";

import { useState } from "react";
import { updateManufacturerOperations } from "./actions";

export type ManufacturerOperationsRecord = {
  manufacturer_id: string;
  lifecycle_status: "trial" | "active" | "paused" | "archived";
  service_tier: "self_managed" | "assisted" | "custom";
  onboarding_stage: "lead" | "setup" | "content" | "pilot" | "launched";
  launch_date: string | null;
  account_owner: string | null;
  next_action: string | null;
  follow_up_date: string | null;
  support_notes: string | null;
  updated_at: string | null;
};

const fieldClass = "min-h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-[#ff4f1f] focus:ring-2 focus:ring-[#ff4f1f]/15";

export default function ManufacturerOperations({ manufacturerId, manufacturerName, operations }: { manufacturerId: string; manufacturerName: string; operations: ManufacturerOperationsRecord }) {
  const [open, setOpen] = useState(false);

  return <div className="border-t border-black/10">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between rounded-md px-4 text-left text-xs font-black uppercase tracking-[.08em] transition hover:bg-black/[.04]">
      <span>Manage account</span><span aria-hidden>{open ? "−" : "+"}</span>
    </button>
    {open && <form action={updateManufacturerOperations} className="border-t border-black/10 bg-[#f7f7f5] p-5">
      <input type="hidden" name="manufacturerId" value={manufacturerId}/>
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#d93a10]">Private platform record</p><h4 className="mt-1 font-black uppercase">{manufacturerName}</h4></div>
        {operations.updated_at && <p className="text-xs text-black/40">Updated {new Date(operations.updated_at).toLocaleDateString()}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Lifecycle status<select name="lifecycleStatus" defaultValue={operations.lifecycle_status} className={`${fieldClass} mt-2`}><option value="trial">Trial</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label>
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Service tier<select name="serviceTier" defaultValue={operations.service_tier} className={`${fieldClass} mt-2`}><option value="self_managed">Self-managed</option><option value="assisted">Assisted</option><option value="custom">Custom</option></select></label>
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Onboarding stage<select name="onboardingStage" defaultValue={operations.onboarding_stage} className={`${fieldClass} mt-2`}><option value="lead">Lead</option><option value="setup">Setup</option><option value="content">Content build</option><option value="pilot">Pilot</option><option value="launched">Launched</option></select></label>
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Launch date<input name="launchDate" type="date" defaultValue={operations.launch_date ?? ""} className={`${fieldClass} mt-2`}/></label>
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">JobberTrain account owner<input name="accountOwner" defaultValue={operations.account_owner ?? ""} placeholder="Name or email" className={`${fieldClass} mt-2`}/></label>
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Follow-up date<input name="followUpDate" type="date" defaultValue={operations.follow_up_date ?? ""} className={`${fieldClass} mt-2`}/></label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Next action<textarea name="nextAction" rows={3} defaultValue={operations.next_action ?? ""} placeholder="What needs to happen next?" className={`${fieldClass} mt-2 py-3`}/></label>
        <label className="text-xs font-bold uppercase tracking-wide text-black/55">Private support notes<textarea name="supportNotes" rows={3} defaultValue={operations.support_notes ?? ""} placeholder="Internal notes are visible only to the JobberTrain platform team." className={`${fieldClass} mt-2 py-3`}/></label>
      </div>
      <div className="mt-5 flex justify-end"><button className="min-h-11 rounded-md bg-black px-5 text-xs font-black uppercase tracking-[.08em] text-white transition hover:bg-[#ff4f1f]">Save account details</button></div>
    </form>}
  </div>;
}
