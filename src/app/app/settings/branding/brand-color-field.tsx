"use client";

import { useState } from "react";

export default function BrandColorField({ label, name, initialValue }: { label: string; name: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  return <label className="grid gap-2 font-bold">{label}<div className="flex overflow-hidden rounded-md border border-black/20 bg-white"><input type="color" value={value} onChange={(event) => setValue(event.target.value.toUpperCase())} className="h-12 w-14 cursor-pointer border-0 bg-white p-1" aria-label={`${label} picker`} /><input name={name} value={value} onChange={(event) => setValue(event.target.value.toUpperCase())} required pattern="#[0-9A-Fa-f]{6}" className="min-w-0 flex-1 border-0 px-3 font-mono uppercase outline-none" aria-label={`${label} hex value`} /></div></label>;
}
