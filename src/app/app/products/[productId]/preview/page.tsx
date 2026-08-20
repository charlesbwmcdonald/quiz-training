import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { ProductVariationViewer, type ProductDetail } from "@/components/product-variation-viewer";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PreviewProduct = ProductDetail & {
  id: string;
  status: string;
  variations?: ProductDetail[];
};

export default async function ProductPreview({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("get_manufacturer_product", { target_id: productId }),
  ]);

  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training || !data) notFound();

  const product = data as PreviewProduct;

  return <div className="min-h-screen bg-white">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <aside className="border-b border-amber-300 bg-amber-50 px-5 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
        <p><b className="uppercase">Preview mode</b> <span className="text-black/55"> - this page is visible only to signed-in team members.</span></p>
        <div className="flex gap-4 font-bold uppercase">
          <Link href={`/m/${brand.slug}/app/products/${product.id}/edit`}>Edit product</Link>
          <Link href={`/m/${brand.slug}/app/products`}>Back to library</Link>
        </div>
      </div>
    </aside>
    <ProductVariationViewer parent={product} variations={product.variations ?? []} primary={brand.primary_color} />
  </div>;
}
