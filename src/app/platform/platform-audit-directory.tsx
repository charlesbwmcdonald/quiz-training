"use client";

import { useMemo, useState } from "react";

export type PlatformAuditRecord = {
  id: number;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  manufacturer_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const label = (value: string) => value.replaceAll("_", " ");

export default function PlatformAuditDirectory({ records }: { records: PlatformAuditRecord[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [manufacturer, setManufacturer] = useState("all");
  const actions = useMemo(() => [...new Set(records.map(record => record.action))].sort(), [records]);
  const manufacturers = useMemo(() => [...new Set(records.map(record => record.manufacturer_name).filter((value): value is string => Boolean(value)))].sort(), [records]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter(record => {
      const search = [record.actor_email, record.action, record.entity_type, record.entity_id, record.manufacturer_name, JSON.stringify(record.details ?? {})].filter(Boolean).join(" ").toLowerCase();
      return (!needle || search.includes(needle)) && (action === "all" || record.action === action) && (manufacturer === "all" || record.manufacturer_name === manufacturer);
    });
  }, [records, query, action, manufacturer]);

  return <div className="mt-5 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
    <div className="grid gap-3 border-b border-black/10 bg-[#f7f7f5] p-4 md:grid-cols-[minmax(220px,1fr)_220px_220px_auto]">
      <label className="sr-only" htmlFor="audit-search">Search activity</label><input id="audit-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search activity, user, or record…" className="min-h-11 rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#ff4f1f] focus:ring-2 focus:ring-[#ff4f1f]/15"/>
      <label className="sr-only" htmlFor="audit-action">Filter by action</label><select id="audit-action" value={action} onChange={event => setAction(event.target.value)} className="min-h-11 rounded-md border border-black/15 bg-white px-3 text-sm font-semibold"><option value="all">All actions</option>{actions.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
      <label className="sr-only" htmlFor="audit-manufacturer">Filter by manufacturer</label><select id="audit-manufacturer" value={manufacturer} onChange={event => setManufacturer(event.target.value)} className="min-h-11 rounded-md border border-black/15 bg-white px-3 text-sm font-semibold"><option value="all">All manufacturers</option>{manufacturers.map(value => <option key={value} value={value}>{value}</option>)}</select>
      <div className="flex min-h-11 items-center justify-end text-xs font-black uppercase tracking-wide text-black/40">{visible.length} records</div>
    </div>
    <div className="max-h-[520px] overflow-auto">
      <table className="w-full min-w-[920px] text-left text-sm"><thead className="sticky top-0 z-10 border-b border-black/10 bg-white text-[10px] uppercase tracking-[.08em] text-black/40"><tr><th className="px-5 py-4">Activity</th><th className="px-5 py-4">Manufacturer</th><th className="px-5 py-4">Performed by</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Record</th></tr></thead><tbody>{visible.map(record => <tr key={record.id} className="border-t border-black/5 align-top hover:bg-black/[.015]"><td className="px-5 py-4"><span className="inline-flex rounded-md bg-black/[.05] px-2 py-1 text-[10px] font-black uppercase tracking-wide">{label(record.action)}</span><p className="mt-2 text-xs capitalize text-black/45">{label(record.entity_type)}</p></td><td className="px-5 py-4 font-semibold">{record.manufacturer_name || "Platform-wide"}</td><td className="px-5 py-4 text-black/60">{record.actor_email || "System"}</td><td className="whitespace-nowrap px-5 py-4 text-black/50">{new Date(record.created_at).toLocaleString()}</td><td className="max-w-[260px] px-5 py-4"><code className="block truncate text-xs text-black/40" title={record.entity_id}>{record.entity_id}</code></td></tr>)}{!visible.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-black/45">No activity matches these filters.</td></tr>}</tbody></table>
    </div>
  </div>;
}
