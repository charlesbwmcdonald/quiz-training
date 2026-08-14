"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createManufacturer } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 bg-black px-6 font-extrabold uppercase tracking-wide text-white transition hover:bg-[#ff4f1f] disabled:opacity-50">{pending ? "Creating…" : "Create manufacturer"}</button>;
}

export default function ManufacturerForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D90000");
  const [secondaryColor, setSecondaryColor] = useState("#000000");
  const makeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const normalizeHex = (value: string) => {
    const next = value.trim().toUpperCase();
    return next.startsWith("#") ? next : `#${next}`;
  };
  const pickerColor = (value: string, fallback: string) => /^#[0-9A-F]{6}$/.test(value) ? value : fallback;

  return <form action={createManufacturer} className="grid gap-4 md:grid-cols-2">
    <label className="grid gap-2 font-bold">Manufacturer name<input name="name" value={name} onChange={(event) => { const value = event.target.value; setName(value); setSlug(makeSlug(value)); }} required maxLength={120} placeholder="Acme Towing" className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#ff4f1f]" /></label>
    <label className="grid gap-2 font-bold">URL slug<input name="slug" value={slug} onChange={(event) => setSlug(makeSlug(event.target.value))} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="acme-towing" className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#ff4f1f]" /><span className="text-xs font-normal text-black/45">Landing page: /m/{slug || "manufacturer-name"}</span></label>
    <label className="grid gap-2 font-bold">Owner email <span className="text-xs font-normal text-black/45">Optional - creates an invitation link</span><input name="ownerEmail" type="email" placeholder="owner@manufacturer.com" className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#ff4f1f]" /></label>
    <label className="grid gap-2 font-bold">Logo URL <span className="text-xs font-normal text-black/45">Optional - can also be added in Brand Studio</span><input name="logoUrl" type="url" placeholder="https://…" className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#ff4f1f]" /></label>
    <label className="grid gap-2 font-bold">Primary color<div className="flex gap-2"><input aria-label="Choose primary color" type="color" value={pickerColor(primaryColor, "#D90000")} onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())} className="h-12 w-14 shrink-0 cursor-pointer border border-black/20 bg-white p-1" /><input name="primaryColor" value={primaryColor} onChange={(event) => setPrimaryColor(normalizeHex(event.target.value))} required pattern="#[0-9A-Fa-f]{6}" maxLength={7} spellCheck={false} placeholder="#D90000" className="min-h-12 min-w-0 flex-1 border border-black/20 px-4 font-mono font-normal uppercase outline-none focus:border-[#ff4f1f]" /></div></label>
    <label className="grid gap-2 font-bold">Secondary color<div className="flex gap-2"><input aria-label="Choose secondary color" type="color" value={pickerColor(secondaryColor, "#000000")} onChange={(event) => setSecondaryColor(event.target.value.toUpperCase())} className="h-12 w-14 shrink-0 cursor-pointer border border-black/20 bg-white p-1" /><input name="secondaryColor" value={secondaryColor} onChange={(event) => setSecondaryColor(normalizeHex(event.target.value))} required pattern="#[0-9A-Fa-f]{6}" maxLength={7} spellCheck={false} placeholder="#000000" className="min-h-12 min-w-0 flex-1 border border-black/20 px-4 font-mono font-normal uppercase outline-none focus:border-[#ff4f1f]" /></div></label>
    <div className="md:col-span-2"><SubmitButton /></div>
  </form>;
}
