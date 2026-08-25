import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductLibraryView, { type LibraryProduct } from "./product-library-view";
import {AcademyPageHeader,AcademySurface,academyButton,academyInput} from "@/components/academy-ui";

type Product = Omit<LibraryProduct, "variations">;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string; q?:string; status?:string }> }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data }] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("manufacturer_products_v2"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");

  const products = (data ?? []) as Product[];
  const children = new Map<string, Product[]>();
  for (const product of products) {
    if (!product.parent_product_id) continue;
    children.set(product.parent_product_id, [...(children.get(product.parent_product_id) ?? []), product]);
  }
  const search = String(query.q ?? "").trim().toLowerCase();
  const status = ["published","draft","archived"].includes(String(query.status)) ? String(query.status) : "all";
  const matches = (product:Product) => !search || [product.name, product.model_sku, product.category_name, product.tagline, product.variation_label].some((value) => value?.toLowerCase().includes(search));
  const roots = products.filter((product) => {
    if (product.parent_product_id) return false;
    if (status !== "all" && product.status !== status) return false;
    return matches(product) || (children.get(product.product_id) ?? []).some(matches);
  });
  const libraryProducts: LibraryProduct[] = roots.map((product) => ({
    ...product,
    variations: (children.get(product.product_id) ?? []).map((variation) => ({ ...variation, variations: [] })),
  }));

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <AcademyPageHeader eyebrow="Reusable content" title="Product Library" description="Build standalone products or group selectable SKUs beneath a shared product family." accent={brand.primary_color} actions={<><Link href={`/m/${brand.slug}/app/products/import`} className={academyButton.secondary}>Import products</Link><Link href={`/m/${brand.slug}/app/products/new`} className={academyButton.primary} style={{backgroundColor:brand.primary_color}}>Add product</Link></>}/>

      {query.error && <div className="mt-6 bg-red-50 p-4 text-red-900">{query.error}</div>}

      <AcademySurface className="mt-6 p-4"><form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
        <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-[.14em] text-black/40">Search products<input name="q" defaultValue={query.q} placeholder="Name, SKU, category, or variation" className={academyInput} /></label>
        <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-[.14em] text-black/40">Status<select name="status" defaultValue={status} className={academyInput}><option value="all">All statuses</option><option value="published">Live</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
        <div className="flex items-end gap-2"><button className={academyButton.primary+" bg-black"}>Apply</button>{(search || status !== "all") && <Link href={`/m/${brand.slug}/app/products`} className={academyButton.tertiary}>Clear</Link>}</div>
      </form></AcademySurface>

      {roots.length === 0 ? <section className="mt-8 grid min-h-72 place-items-center rounded-lg border-2 border-dashed border-black/15 bg-white p-8 text-center">
        <div><h2 className="text-2xl font-extrabold uppercase">{products.length ? "No matching products" : "Create your first product"}</h2><p className="mt-2 text-black/55">{products.length ? "Try a different search or status filter." : "Add specs, imagery, benefits, videos, downloads, and variations."}</p></div>
      </section> : <ProductLibraryView products={libraryProducts} manufacturerSlug={brand.slug} primary={brand.primary_color} />}
    </main>
  </div>;
}
