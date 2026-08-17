import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductLibraryView, { type LibraryProduct } from "./product-library-view";

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
      <div className="flex flex-wrap justify-between gap-5">
        <div>
          <p className="text-sm font-extrabold uppercase italic tracking-[.2em]" style={{ color: brand.primary_color }}>Reusable content</p>
          <h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Product Library</h1>
          <p className="mt-3 text-black/55">Build standalone products or group selectable SKUs beneath a shared product family.</p>
        </div>
        <div className="flex flex-wrap gap-3 self-end"><Link href={`/m/${brand.slug}/app/products/import`} className="grid min-h-13 place-items-center border-2 border-black px-6 font-extrabold uppercase transition hover:bg-black hover:text-white">Import Products</Link><Link href={`/m/${brand.slug}/app/products/new`} className="grid min-h-13 place-items-center px-6 font-extrabold uppercase text-white transition hover:brightness-90" style={{ backgroundColor: brand.primary_color }}>+ Add Product</Link></div>
      </div>

      {query.error && <div className="mt-6 bg-red-50 p-4 text-red-900">{query.error}</div>}

      <form className="mt-7 grid gap-3 border border-black/10 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
        <label className="grid gap-1 text-xs font-extrabold uppercase tracking-wide text-black/45">Search products<input name="q" defaultValue={query.q} placeholder="Name, SKU, category, or variation" className="min-h-11 border border-black/20 px-3 text-sm font-normal normal-case tracking-normal text-black outline-none focus:border-black" /></label>
        <label className="grid gap-1 text-xs font-extrabold uppercase tracking-wide text-black/45">Status<select name="status" defaultValue={status} className="min-h-11 border border-black/20 bg-white px-3 text-sm font-normal normal-case tracking-normal text-black"><option value="all">All statuses</option><option value="published">Live</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
        <div className="flex items-end gap-2"><button className="min-h-11 bg-black px-5 text-sm font-extrabold uppercase text-white">Search</button>{(search || status !== "all") && <Link href={`/m/${brand.slug}/app/products`} className="grid min-h-11 place-items-center border px-4 text-sm font-bold uppercase">Clear</Link>}</div>
      </form>

      {roots.length === 0 ? <section className="mt-8 grid min-h-72 place-items-center border-2 border-dashed bg-white p-8 text-center">
        <div><h2 className="text-2xl font-extrabold uppercase">{products.length ? "No matching products" : "Create your first product"}</h2><p className="mt-2 text-black/55">{products.length ? "Try a different search or status filter." : "Add specs, imagery, benefits, videos, downloads, and variations."}</p></div>
      </section> : <ProductLibraryView products={libraryProducts} manufacturerSlug={brand.slug} primary={brand.primary_color} />}
    </main>
  </div>;
}
