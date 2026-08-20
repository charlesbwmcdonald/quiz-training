"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function createProgram(f: FormData) {
  const requirements = f.getAll("requirements").map((v, i) => {
    const [type, id] = String(v).split(":");
    return { type, id, position: i };
  });
  const s = await createSupabaseServerClient();
  const { error } = await s.rpc("create_certification_program", {
    program_name: String(f.get("name") || ""),
    program_description: String(f.get("description") || ""),
    minimum_learners: Number(f.get("minimumLearners") || 1),
    valid_months: f.get("validityMonths")
      ? Number(f.get("validityMonths"))
      : null,
    requirements,
  });
  if (error)
    redirect(`/app/certifications?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/certifications");
  redirect("/app/certifications?created=1");
}
export async function assignProgram(f: FormData) {
  const s = await createSupabaseServerClient();
  const { error } = await s.rpc("assign_certification_program", {
    target_program_id: String(f.get("programId")),
    target_company_ids: f.getAll("companyIds").map(String),
  });
  if (error)
    redirect(`/app/certifications?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/certifications");
  revalidatePath("/app/assignments");
  redirect("/app/certifications?assigned=1");
}
