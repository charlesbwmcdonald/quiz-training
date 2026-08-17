"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createUserInvitation(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_manufacturer_invitation", { invite_email: String(formData.get("email") ?? "").trim(), invite_kind: String(formData.get("kind") ?? ""), target_company_id: String(formData.get("companyId") ?? "") || null, invite_role: String(formData.get("role") ?? "learner") });
  if (error) redirect(`/app/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/users"); redirect(`/app/users?invited=${data}`);
}
export async function manageInvitation(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_manufacturer_invitation", { target_invitation_id: String(formData.get("invitationId") ?? ""), next_action: String(formData.get("action") ?? "") });
  if (error) redirect(`/app/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/users");
}

export async function manageMember(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_manufacturer_member", {
    target_user_id: String(formData.get("userId") ?? ""),
    membership_scope: String(formData.get("scope") ?? ""),
    target_company_id: String(formData.get("companyId") ?? "") || null,
    next_role: String(formData.get("role") ?? "") || null,
    next_action: String(formData.get("action") ?? "update"),
  });
  if (error) redirect(`/app/users?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/users");
  redirect("/app/users?updated=1");
}
