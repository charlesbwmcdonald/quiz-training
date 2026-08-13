"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createInvitation } from "./actions";

type Option = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 bg-[#d90000] px-6 font-extrabold uppercase tracking-wide text-white hover:bg-[#a90000] disabled:opacity-50">{pending ? "Creating…" : "Create invitation"}</button>;
}

export default function InviteForm({ manufacturers, companies }: { manufacturers: Option[]; companies: Option[] }) {
  const [type, setType] = useState("manufacturer_owner");
  const manufacturerInvite = type.startsWith("manufacturer_");
  const roles = manufacturerInvite
    ? type === "manufacturer_owner" ? ["owner"] : ["admin", "content_manager", "viewer"]
    : type === "retailer_manager" ? ["manager"] : ["learner"];

  return <form action={createInvitation} className="grid gap-4 md:grid-cols-2">
    <label className="grid gap-2 font-bold">Email address<input name="email" type="email" required placeholder="name@company.com" className="min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-[#d90000]" /></label>
    <label className="grid gap-2 font-bold">Invite as<select name="invitationType" value={type} onChange={(event) => setType(event.target.value)} className="min-h-12 border border-black/20 bg-white px-4 font-normal outline-none focus:border-[#d90000]"><option value="manufacturer_owner">Manufacturer owner</option><option value="manufacturer_member">Manufacturer team member</option><option value="retailer_manager">Retailer manager</option><option value="retailer_learner">Retailer learner</option></select></label>
    {manufacturerInvite ? <label className="grid gap-2 font-bold">Manufacturer<select name="manufacturerId" required className="min-h-12 border border-black/20 bg-white px-4 font-normal outline-none focus:border-[#d90000]"><option value="">Select manufacturer</option>{manufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <label className="grid gap-2 font-bold">Retailer company<select name="companyId" required className="min-h-12 border border-black/20 bg-white px-4 font-normal outline-none focus:border-[#d90000]"><option value="">Select retailer</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <label className="grid gap-2 font-bold">Role<select name="role" className="min-h-12 border border-black/20 bg-white px-4 font-normal outline-none focus:border-[#d90000]">{roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label>
    <div className="md:col-span-2"><SubmitButton /></div>
  </form>;
}
