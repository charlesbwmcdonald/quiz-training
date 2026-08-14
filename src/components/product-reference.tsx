import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductReferenceViewer } from "@/components/product-reference-viewer";
import type { ProductDetail } from "@/components/product-variation-viewer";

type Product = ProductDetail & { slug:string; variations?:ProductDetail[] };

export async function ProductReference({ productId, manufacturerSlug, primary, annotation }: { productId:string; manufacturerSlug:string; primary:string; annotation?:string }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_manufacturer_product", { target_id:productId });
  if (!data) return <div className="bg-amber-50 p-4">This product is unavailable.</div>;
  const product = data as Product;
  product.variations = (product.variations ?? []).filter((variation) => variation.status === "published");
  return <ProductReferenceViewer product={product} manufacturerSlug={manufacturerSlug} primary={primary} annotation={annotation} />;
}
