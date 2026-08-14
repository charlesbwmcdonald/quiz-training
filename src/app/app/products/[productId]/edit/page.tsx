import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductEditor from "../../product-editor";

type ProductOption = { product_id: string; name: string; is_family: boolean; parent_product_id: string | null };

export default async function EditProduct({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data }, { data: products }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("get_manufacturer_product", { target_id: productId }),
    supabase.rpc("manufacturer_products_v2"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training || !data) notFound();

  const parentOptions = ((products ?? []) as ProductOption[]).filter((product) => product.is_family && !product.parent_product_id && product.product_id !== productId);

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link href={`/m/${brand.slug}/app/products`} className="font-bold text-black/50">← Products</Link>
      <p className="mt-7 text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Product editor</p>
      <h1 className="mt-2 text-4xl font-extrabold uppercase">Edit {data.name}</h1>
      <ProductEditor primary={brand.primary_color} initial={data} parentOptions={parentOptions} />
    </main>
  </div>;
}
