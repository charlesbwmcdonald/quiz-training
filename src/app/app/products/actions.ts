"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const lines = (value: FormDataEntryValue | null) => String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);

function jsonValue<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return JSON.parse(String(value ?? "")) as T;
  } catch {
    return fallback;
  }
}

export async function saveProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const mode = String(formData.get("productMode") ?? "standalone");
  const parentId = mode === "variation" ? String(formData.get("parentProductId") ?? "") : "";
  const variationLabel = mode === "variation" ? String(formData.get("variationLabel") ?? "").trim() : "";

  if (!name || !slug) redirect("/app/products/new?error=Product+name+and+URL+slug+are+required.");
  if (mode === "variation" && (!parentId || !variationLabel)) redirect("/app/products/new?error=Choose+a+product+family+and+name+the+variation.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_manufacturer_product_v2", {
    target_id: String(formData.get("productId") ?? "") || null,
    product_name: name,
    product_slug: slug,
    category_name: String(formData.get("category") ?? ""),
    model_sku: String(formData.get("modelSku") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    description: String(formData.get("description") ?? ""),
    images: lines(formData.get("images")).map((url) => ({ url })),
    features: lines(formData.get("features")),
    specs: jsonValue(formData.get("specs"), []),
    compatibility: String(formData.get("compatibility") ?? ""),
    videos: lines(formData.get("videos")).map((url) => ({ url })),
    downloads: lines(formData.get("downloads")).map((url) => ({ url })),
    product_url: String(formData.get("productUrl") ?? ""),
    product_status: formData.get("intent") === "published" ? "published" : "draft",
    product_is_family: mode === "family",
    product_parent_id: parentId || null,
    product_variation_label: variationLabel || null,
    product_variation_options: jsonValue(formData.get("variationOptions"), {}),
  });

  if (error) redirect(`/app/products/new?error=${encodeURIComponent(error.message)}`);
  redirect("/app/products?saved=1");
}

export async function duplicateProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("duplicate_manufacturer_product", { target_id: String(formData.get("productId")) });
  if (error) redirect(`/app/products?error=${encodeURIComponent(error.message)}`);
  redirect("/app/products?duplicated=1");
}

export async function archiveProduct(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_manufacturer_product", { target_id: String(formData.get("productId")) });
  if (error) redirect(`/app/products?error=${encodeURIComponent(error.message)}`);
  redirect("/app/products?archived=1");
}

export async function deleteProduct(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!productId || confirmation !== "DELETE") {
    redirect("/app/products?error=Type+DELETE+exactly+to+permanently+delete+the+product.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_manufacturer_product", {
    target_id: productId,
    confirmation_text: confirmation,
  });
  if (error) redirect(`/app/products?error=${encodeURIComponent(error.message)}`);
  redirect("/app/products?deleted=1");
}
