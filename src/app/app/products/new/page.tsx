import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductEditor from "../product-editor";
import { AcademyPageHeader } from "@/components/academy-ui";

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
      <div className="mt-7"><AcademyPageHeader eyebrow="Product editor" title={parent ? `Add Variation to ${parent.name}` : "Add Product"} description={parent ? "Create a selectable SKU beneath this product family and define the attributes that distinguish it." : "Create a reusable product record for academy pages, courses, and retailer training."} accent={brand.primary_color}/></div>
      {query.error && <div className="mt-5 bg-red-50 p-4 text-red-900">{query.error}</div>}
      <ProductEditor
        primary={brand.primary_color}
        parentOptions={parentOptions}
        initial={parent ? { parent_product_id: parent.product_id } : undefined}
      />
    </main>
  </div>;
}
