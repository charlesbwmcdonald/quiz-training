import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductEditor from "../product-editor";

type ProductOption = { product_id: string; name: string; is_family: boolean; parent_product_id: string | null };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ parentId?: string; error?: string }> }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data: products }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("manufacturer_products_v2"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");

  const parentOptions = ((products ?? []) as ProductOption[]).filter((product) => product.is_family && !product.parent_product_id);
  const parent = parentOptions.find((product) => product.product_id === query.parentId);

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link href={`/m/${brand.slug}/app/products`} className="font-bold text-black/50">← Products</Link>
      <p className="mt-7 text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Product editor</p>
      <h1 className="mt-2 text-4xl font-extrabold uppercase">{parent ? `Add variation to ${parent.name}` : "Add product"}</h1>
      {query.error && <div className="mt-5 bg-red-50 p-4 text-red-900">{query.error}</div>}
      <ProductEditor
        primary={brand.primary_color}
        parentOptions={parentOptions}
        initial={parent ? { parent_product_id: parent.product_id } : undefined}
      />
    </main>
  </div>;
}
