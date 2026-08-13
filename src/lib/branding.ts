import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManufacturerBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  landing_headline: string | null;
  landing_description: string | null;
  hero_image_url?: string | null;
  hero_overlay?: number;
  hero_alignment?: "left" | "center";
  hero_height?: "compact" | "large" | "full";
  hero_cta_text?: string;
  promo_enabled?: boolean;
  promo_text?: string | null;
  promo_link_url?: string | null;
  promo_link_text?: string | null;
  banner_image_url?: string | null;
  banner_link_url?: string | null;
  custom_html?: string | null;
  can_manage_brand?: boolean;
  can_manage_training?: boolean;
  can_view_reports?: boolean;
};

export async function getPublicBrand(slug?: string | null) {
  if (!slug) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_manufacturer_brand", {
    manufacturer_slug: slug,
  });
  if (error || !data?.[0]) return null;
  return data[0] as ManufacturerBrand;
}

export async function getActiveBrand() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_active_manufacturer_brand");
  if (error || !data?.[0]) return null;
  return data[0] as ManufacturerBrand;
}
