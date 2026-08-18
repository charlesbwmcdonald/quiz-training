import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductVariationViewer, type ProductDetail } from "@/components/product-variation-viewer";
import { PublicManufacturerHeader } from "@/components/manufacturer-shell";

type Product = ProductDetail & {
  manufacturer_name: string;
  manufacturer_slug: string;
  primary_color: string;
  logo_url: string | null;
  variations: ProductDetail[];
};

export default async function PublicProduct({ params }: { params: Promise<{ manufacturerSlug: string; productSlug: string }> }) {
  const { manufacturerSlug, productSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_product_v2", { manufacturer_slug: manufacturerSlug, product_slug: productSlug });
  if (!data) notFound();
  const product = data as Product;

  return <main className="min-h-screen bg-white">
    <PublicManufacturerHeader brand={{ name: product.manufacturer_name, slug: product.manufacturer_slug, logo_url: product.logo_url, primary_color: product.primary_color }} showAcademyHome />
    <ProductVariationViewer parent={product} variations={product.variations ?? []} primary={product.primary_color} />
  </main>;
}
