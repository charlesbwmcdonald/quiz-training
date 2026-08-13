"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const HEX = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function updateBranding(formData: FormData) {
  const manufacturerId = String(formData.get("manufacturerId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const secondaryColor = String(formData.get("secondaryColor") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const heroOverlay = Math.min(90, Math.max(0, Number(formData.get("heroOverlay") ?? 55)));
  const heroAlignment = formData.get("heroAlignment") === "center" ? "center" : "left";
  const heroHeight = ["compact", "large", "full"].includes(String(formData.get("heroHeight"))) ? String(formData.get("heroHeight")) : "large";
  const heroCtaText = String(formData.get("heroCtaText") ?? "Start training").trim();
  const promoEnabled = formData.get("promoEnabled") === "on";
  const promoText = String(formData.get("promoText") ?? "").trim();
  const promoLinkUrl = String(formData.get("promoLinkUrl") ?? "").trim();
  const promoLinkText = String(formData.get("promoLinkText") ?? "").trim();
  const bannerLinkUrl = String(formData.get("bannerLinkUrl") ?? "").trim();
  const customHtml = String(formData.get("customHtml") ?? "").trim();
  const logo = formData.get("logo");
  const heroImage = formData.get("heroImage");
  const bannerImage = formData.get("bannerImage");
  const fail = (message: string): never => redirect(`/app/settings/branding?error=${encodeURIComponent(message)}`);

  if (!manufacturerId || !name) fail("Manufacturer name is required.");
  if (!HEX.test(primaryColor) || !HEX.test(secondaryColor)) fail("Choose valid six-digit brand colors.");
  if (headline.length > 140 || description.length > 500) fail("The landing-page text is too long.");

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

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
  const heroImageUrl = await uploadBrandImage(heroImage, "Hero image");
  const bannerImageUrl = await uploadBrandImage(bannerImage, "Banner image");

  const updates: Record<string, string | number | boolean> = {
    name,
    primary_color: primaryColor.toUpperCase(),
    secondary_color: secondaryColor.toUpperCase(),
    landing_headline: headline,
    landing_description: description,
    hero_overlay: heroOverlay,
    hero_alignment: heroAlignment,
    hero_height: heroHeight,
    hero_cta_text: heroCtaText || "Start training",
    promo_enabled: promoEnabled,
    promo_text: promoText,
    promo_link_url: promoLinkUrl,
    promo_link_text: promoLinkText,
    banner_link_url: bannerLinkUrl,
    custom_html: customHtml,
  };
  if (logoUrl) updates.logo_url = logoUrl;
  if (heroImageUrl) updates.hero_image_url = heroImageUrl;
  if (bannerImageUrl) updates.banner_image_url = bannerImageUrl;
  const { error } = await supabase.from("manufacturers").update(updates).eq("id", manufacturerId);
  if (error) fail(error.message);
  revalidatePath(`/m/${slug}`);
  revalidatePath("/app");
  redirect("/app/settings/branding?saved=1");
}
