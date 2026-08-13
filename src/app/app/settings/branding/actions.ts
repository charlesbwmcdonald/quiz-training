"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LandingExperience, LandingSection } from "@/lib/branding";

const HEX = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function updateBranding(formData: FormData) {
  const manufacturerId = String(formData.get("manufacturerId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const fail = (message: string): never => redirect(`/app/settings/branding?error=${encodeURIComponent(message)}`);
  const name = String(formData.get("name") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const secondaryColor = String(formData.get("secondaryColor") ?? "").trim();
  const loginHeadline = String(formData.get("loginHeadline") ?? "").trim();
  const loginDescription = String(formData.get("loginDescription") ?? "").trim();
  const intent = formData.get("intent") === "publish" ? "publish" : "draft";
  let pageSections: LandingSection[] = [];
  try {
    const rawSections = String(formData.get("pageSections") ?? "[]");
    if (rawSections.length > 60000) throw new Error();
    const parsed = JSON.parse(rawSections);
    if (!Array.isArray(parsed)) throw new Error();
    const allowed = new Set(["announcement", "hero", "carousel", "benefits", "banner", "cta"]);
    pageSections = parsed.filter((section) => section && typeof section.id === "string" && allowed.has(section.type) && typeof section.config === "object").slice(0, 30);
  } catch {
    fail("The landing-page layout could not be saved. Refresh and try again.");
  }
  const safeLink = (value:unknown) => !value || (typeof value === "string" && ((value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value)));
  const logo = formData.get("logo");
  const loginImage = formData.get("loginImage");
  if (!manufacturerId || !name) fail("Manufacturer name is required.");
  if (!HEX.test(primaryColor) || !HEX.test(secondaryColor)) fail("Choose valid six-digit brand colors.");
  if (loginHeadline.length > 120 || loginDescription.length > 400) fail("The sign-in text is too long.");

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: existingRow } = await supabase.from("manufacturers").select("landing_experience").eq("id", manufacturerId).single();
  const existingExperience = (existingRow?.landing_experience ?? {}) as LandingExperience;

  let logoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    if (!ALLOWED_TYPES.has(logo.type)) fail("Logo must be a PNG, JPG, or WebP image.");
    if (logo.size > 5 * 1024 * 1024) fail("Logo must be smaller than 5 MB.");
    const extension = logo.type === "image/png" ? "png" : logo.type === "image/webp" ? "webp" : "jpg";
    const path = `${manufacturerId}/logo-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("manufacturer-branding").upload(path, logo, { contentType: logo.type });
    if (uploadError) fail(uploadError.message);
    logoUrl = supabase.storage.from("manufacturer-branding").getPublicUrl(path).data.publicUrl;
  }

  const uploadBrandImage = async (file: FormDataEntryValue | null, label: string) => {
    if (!(file instanceof File) || file.size === 0) return undefined;
    if (!ALLOWED_TYPES.has(file.type)) fail(`${label} must be a PNG, JPG, or WebP image.`);
    if (file.size > 8 * 1024 * 1024) fail(`${label} must be smaller than 8 MB.`);
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${manufacturerId}/${label.toLowerCase().replaceAll(" ", "-")}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("manufacturer-branding").upload(path, file, { contentType: file.type });
    if (error) fail(error.message);
    return supabase.storage.from("manufacturer-branding").getPublicUrl(path).data.publicUrl;
  };
  const loginImageUrl = await uploadBrandImage(loginImage, "Login image");

  for (const section of pageSections) {
    const image = formData.get(`sectionImage:${section.id}`);
    const imageUrl = await uploadBrandImage(image, `${section.type}-${section.id}`);
    if (imageUrl) section.config.image_url = imageUrl;
  }
  if (pageSections.some((section) => !safeLink(section.config.link_url) || !safeLink(section.config.image_url))) fail("Landing-page links must be secure https:// URLs or internal paths beginning with /.");
  if (pageSections.some((section) => section.type === "announcement" && String(section.config.messages ?? "").split("\n").some((line) => { const link=line.split("|").slice(1).join("|").trim(); return !safeLink(link); }))) fail("Announcement links must be secure https:// URLs or internal paths beginning with /.");

  const landingExperience: LandingExperience = {
    ...existingExperience,
    login: {
      headline: loginHeadline || "Welcome to your training center",
      description: loginDescription || "Sign in to continue your product training.",
      ...(loginImageUrl ? { image_url: loginImageUrl } : {}),
    },
    draft_sections: pageSections,
    ...(intent === "publish" ? { published_sections: pageSections, published_at: new Date().toISOString() } : {}),
  };

  if (!loginImageUrl) {
    const existingUrl = existingExperience.login?.image_url;
    if (existingUrl && landingExperience.login) landingExperience.login.image_url = existingUrl;
  }

  const updates: Record<string, string | number | boolean | object> = {
    name,
    primary_color: primaryColor.toUpperCase(),
    secondary_color: secondaryColor.toUpperCase(),
    landing_experience: landingExperience,
  };
  if (logoUrl) updates.logo_url = logoUrl;
  const { error } = await supabase.from("manufacturers").update(updates).eq("id", manufacturerId);
  if (error) fail(error.message);
  revalidatePath(`/m/${slug}`);
  revalidatePath("/app");
  redirect(`/app/settings/branding?saved=1&mode=${intent}`);
}
