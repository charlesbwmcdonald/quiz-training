export type DealerProgramStatus = "draft" | "active" | "archived";

export type DealerProgram = {
  id: string;
  manufacturer_id: string;
  title: string;
  summary: string;
  offer_details: string;
  eligibility: string | null;
  terms: string | null;
  flyer_path: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cta_label: string;
  starts_at: string | null;
  ends_at: string | null;
  status: DealerProgramStatus;
  audience_mode: "all" | "selected";
  created_at: string;
  updated_at: string;
};

export function effectiveProgramStatus(program: Pick<DealerProgram,"status"|"starts_at"|"ends_at">) {
  if (program.status === "draft" || program.status === "archived") return program.status;
  const now = Date.now();
  if (program.starts_at && new Date(program.starts_at).getTime() > now) return "scheduled";
  if (program.ends_at && new Date(program.ends_at).getTime() <= now) return "expired";
  return "active";
}

export function programStatusClass(status: string) {
  if (status === "active") return "bg-green-50 text-green-800";
  if (status === "scheduled") return "bg-blue-50 text-blue-800";
  if (status === "expired" || status === "archived") return "bg-amber-50 text-amber-800";
  return "bg-black/5 text-black/55";
}

export function formatProgramDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US",{dateStyle:"medium"}).format(new Date(value)) : null;
}
