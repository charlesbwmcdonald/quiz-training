import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { archiveProduct, duplicateProduct } from "./actions";
import ProductDeleteButton from "./product-delete-button";

type Product = {
  product_id: string;
  name: string;
  slug: string;
  category_name: string | null;
  model_sku: string | null;
  tagline: string | null;
  status: string;
  primary_image: string | null;
  course_count: number;
  parent_product_id: string | null;
  is_family: boolean;
  variation_label: string | null;
  variation_options: Record<string, string>;
  variation_count: number;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
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
  const roots = products.filter((product) => !product.parent_product_id);
  const children = new Map<string, Product[]>();
  for (const product of products) {
    if (!product.parent_product_id) continue;
    children.set(product.parent_product_id, [...(children.get(product.parent_product_id) ?? []), product]);
  }

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap justify-between gap-5">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Reusable content</p>
          <h1 className="mt-2 text-4xl font-extrabold uppercase">Product Library</h1>
          <p className="mt-3 text-black/55">Build standalone products or group selectable SKUs beneath a shared product family.</p>
        </div>
        <Link href={`/m/${brand.slug}/app/products/new`} className="self-end px-6 py-4 font-extrabold uppercase text-white" style={{ backgroundColor: brand.primary_color }}>+ Add product</Link>
      </div>

      {query.error && <div className="mt-6 bg-red-50 p-4 text-red-900">{query.error}</div>}

      {roots.length === 0 ? <section className="mt-8 grid min-h-72 place-items-center border-2 border-dashed bg-white p-8 text-center">
        <div><h2 className="text-2xl font-extrabold uppercase">Create your first product</h2><p className="mt-2 text-black/55">Add specs, imagery, benefits, videos, downloads, and variations.</p></div>
      </section> : <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {roots.map((product) => {
          const variations = children.get(product.product_id) ?? [];
          const previewHref = `/m/${brand.slug}/app/products/${product.product_id}/preview`;
          return <article key={product.product_id} className="overflow-hidden border border-black/10 bg-white">
            <div className="grid sm:grid-cols-[220px_1fr]">
              <Link href={previewHref} aria-label={`Preview ${product.name}`} className="block">
                {product.primary_image ? <Image src={product.primary_image} alt="" width={640} height={480} unoptimized className="h-full min-h-56 w-full object-cover" /> : <div className="grid min-h-56 place-items-center bg-black/5 text-sm font-bold uppercase text-black/35">No image</div>}
              </Link>
              <div className="p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <span className="text-xs font-bold uppercase" style={{ color: brand.primary_color }}>{product.category_name || "Uncategorized"}</span>
                  <span className="text-xs font-bold uppercase text-black/40">{product.is_family ? `Family · ${variations.length} variations` : product.status}</span>
                </div>
                <h2 className="mt-3 text-2xl font-extrabold uppercase"><Link href={previewHref} className="hover:underline">{product.name}</Link></h2>
                {product.model_sku && <p className="mt-1 text-xs font-bold uppercase text-black/40">{product.model_sku}</p>}
                <p className="mt-3 min-h-12 text-sm leading-6 text-black/60">{product.tagline || "Product knowledge profile"}</p>
                <p className="mt-4 border-t pt-4 text-sm"><b>{product.course_count}</b> course references</p>
                <div className="mt-5 flex flex-wrap gap-4 text-xs font-extrabold uppercase">
                  <Link href={previewHref} target="_blank">Preview ↗</Link>
                  <Link href={`/m/${brand.slug}/app/products/${product.product_id}/edit`}>Edit</Link>
                  {product.status === "published" && <Link href={`/m/${brand.slug}/products/${product.slug}`} target="_blank">View live ↗</Link>}
                  {product.is_family && <Link href={`/m/${brand.slug}/app/products/new?parentId=${product.product_id}`} style={{ color: brand.primary_color }}>+ Variation</Link>}
                  <form action={duplicateProduct}><input type="hidden" name="productId" value={product.product_id} /><button>Duplicate</button></form>
                  {product.status !== "archived" && <form action={archiveProduct}><input type="hidden" name="productId" value={product.product_id} /><button className="text-red-700">Archive</button></form>}
                  <ProductDeleteButton productId={product.product_id} productName={product.name} variationCount={variations.length} />
                </div>
              </div>
            </div>

            {product.is_family && <div className="border-t bg-black/[.025] p-5">
              <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-black/50">Variations</h3><Link href={`/m/${brand.slug}/app/products/new?parentId=${product.product_id}`} className="text-xs font-extrabold uppercase">Add variation →</Link></div>
              {variations.length ? <div className="mt-3 grid gap-2">
                {variations.map((variation) => <div key={variation.product_id} className="flex flex-wrap items-center justify-between gap-3 border bg-white p-4">
                  <div>
                    <b className="block">{variation.variation_label || variation.name}</b>
                    <span className="mt-1 block text-xs text-black/45">{variation.model_sku || "No SKU"} · {variation.status}</span>
                    {Object.keys(variation.variation_options ?? {}).length > 0 && <span className="mt-2 flex flex-wrap gap-1.5">{Object.entries(variation.variation_options).map(([label, value]) => <span key={label} className="bg-black/5 px-2 py-1 text-[10px] font-bold uppercase">{label}: {value}</span>)}</span>}
                  </div>
                  <div className="flex gap-3 text-xs font-extrabold uppercase">
                    <Link href={`/m/${brand.slug}/app/products/${variation.product_id}/edit`}>Edit</Link>
                    <form action={duplicateProduct}><input type="hidden" name="productId" value={variation.product_id} /><button>Duplicate</button></form>
                    <ProductDeleteButton productId={variation.product_id} productName={variation.variation_label || variation.name} />
                  </div>
                </div>)}
              </div> : <p className="mt-3 border border-dashed p-4 text-sm text-black/45">No variations yet. Add the first selectable SKU or configuration.</p>}
            </div>}
          </article>;
        })}
      </div>}
    </main>
  </div>;
}
