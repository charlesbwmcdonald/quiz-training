"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createInvitation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const invitationType = String(formData.get("invitationType") ?? "");
  const role = String(formData.get("role") ?? "owner");
  const manufacturerId = String(formData.get("manufacturerId") ?? "") || null;
  const companyId = String(formData.get("companyId") ?? "") || null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_platform_invitation", {
    invite_email: email,
    invite_type: invitationType,
    target_manufacturer_id: manufacturerId,
    target_company_id: companyId,
    invite_role: role,
  });
  if (error) redirect(`/platform?error=${encodeURIComponent(error.message)}#invite`);
  revalidatePath("/platform");
  redirect("/platform?invited=1#invite");
}

export async function createManufacturer(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_platform_manufacturer", {
    manufacturer_name: String(formData.get("name") ?? ""),
    manufacturer_slug: String(formData.get("slug") ?? ""),
    owner_email: String(formData.get("ownerEmail") ?? "") || null,
    logo_url: String(formData.get("logoUrl") ?? "") || null,
    primary_color: String(formData.get("primaryColor") ?? "#D90000"),
    secondary_color: String(formData.get("secondaryColor") ?? "#000000"),
  });
  if (error) redirect(`/platform?manufacturerError=${encodeURIComponent(error.message)}#manufacturers`);
  revalidatePath("/platform");
  const invitationId = (data as { invitation_id?: string | null } | null)?.invitation_id;
  redirect(`/platform?created=1${invitationId ? `&invited=1` : ""}#manufacturers`);
}

export async function openManufacturerDashboard(formData: FormData) {
  const manufacturerId = String(formData.get("manufacturerId") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data: slug, error } = await supabase.rpc("select_platform_manufacturer", {
    target_manufacturer_id: manufacturerId,
  });
  if (error || typeof slug !== "string") redirect(`/platform?error=${encodeURIComponent(error?.message || "Manufacturer could not be opened.")}`);
  redirect(`/m/${slug}/app`);
}

export async function managePlatformUser(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_platform_user", {
    target_user_id: String(formData.get("userId") ?? ""),
    membership_scope: String(formData.get("scope") ?? ""),
    target_org_id: String(formData.get("organizationId") ?? "") || null,
    next_role: String(formData.get("role") ?? "") || null,
    next_action: String(formData.get("action") ?? "update"),
  });
  if (error) redirect(`/platform?error=${encodeURIComponent(error.message)}#users`);
  revalidatePath("/platform");
  redirect("/platform?updated=1#users");
}

export async function managePlatformInvitation(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("manage_platform_invitation", {
    target_invitation_id: String(formData.get("invitationId") ?? ""),
    next_action: String(formData.get("action") ?? ""),
  });
  if (error) redirect(`/platform?error=${encodeURIComponent(error.message)}#invitations`);
  revalidatePath("/platform");
  redirect("/platform?updated=1#invitations");
}
