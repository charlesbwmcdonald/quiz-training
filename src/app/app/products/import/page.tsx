import Link from "next/link";
import { redirect } from "next/navigation";
import CsvImporter from "@/components/csv-importer";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { importProducts } from "./actions";

export default async function ProductImportPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([supabase.auth.getUser(), getActiveBrand()]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link href={`/m/${brand.slug}/app/products`} className="font-bold text-black/50">← Product Library</Link>
      <p className="mt-7 text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Bulk creation</p>
      <h1 className="mt-2 text-4xl font-extrabold uppercase">Import products</h1>
      <p className="mt-3 text-black/55">Import standalone products, parent families, variations, categories, galleries, specifications, videos, and downloads.</p>
      {query.error && <div className="mt-5 bg-red-50 p-4 text-red-900">{query.error}</div>}

      <details open className="group mt-8 border border-black/10 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-6 marker:content-none sm:p-8 [&::-webkit-details-marker]:hidden">
          <div><p className="text-xs font-extrabold uppercase tracking-[.16em]" style={{ color: brand.primary_color }}>Before uploading</p><h2 className="mt-2 text-xl font-extrabold uppercase">How to prepare your CSV</h2></div>
          <span aria-hidden="true" className="text-xl transition group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-black/10 px-6 pb-7 pt-6 sm:px-8">
          <div className="grid gap-7 md:grid-cols-2">
            <div><h3 className="font-extrabold uppercase">Required fields</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-black/65"><li><b>name</b> - product display name</li><li><b>slug</b> - lowercase URL name using letters, numbers, and hyphens only</li><li>Use one row for each product</li><li>Keep the template column headers unchanged</li></ul></div>
            <div><h3 className="font-extrabold uppercase">Multiple values</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-black/65"><li>Separate images, features, videos, and downloads with <code className="bg-black/5 px-1.5 py-1 font-bold">|</code></li><li>Write specifications as <code className="bg-black/5 px-1.5 py-1 font-bold">Label=Value</code></li><li>Separate multiple specifications with <code className="bg-black/5 px-1.5 py-1 font-bold">|</code></li><li>URLs must include <code className="bg-black/5 px-1.5 py-1 font-bold">https://</code></li></ul></div>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3"><div className="border p-4"><b className="uppercase">Standalone</b><p className="mt-2 text-sm text-black/60">Set <code>product_type</code> to <code>standalone</code>. Leave all parent and variation fields blank.</p></div><div className="border p-4"><b className="uppercase">Family</b><p className="mt-2 text-sm text-black/60">Set <code>product_type</code> to <code>family</code>. This row holds the shared product content.</p></div><div className="border p-4"><b className="uppercase">Variation</b><p className="mt-2 text-sm text-black/60">Set <code>product_type</code> to <code>variation</code>, then provide <code>parent_slug</code> and <code>variation_label</code>.</p></div></div>
          <div className="mt-5 border-l-4 bg-black/[.03] p-5" style={{ borderColor: brand.primary_color }}><h3 className="font-extrabold uppercase">Variation options</h3><p className="mt-2 text-sm text-black/60">Use <code>variation_options</code> for selectable attributes, formatted like specifications.</p><code className="mt-3 block overflow-x-auto whitespace-nowrap text-sm">Shank Size=2.5 in|Capacity=21000 lb|Finish=Powder coat</code></div>
          <div className="mt-7 border-l-4 bg-black/[.03] p-5" style={{ borderColor: brand.primary_color }}><h3 className="font-extrabold uppercase">Specification example</h3><code className="mt-3 block overflow-x-auto whitespace-nowrap text-sm">Towing Capacity=32,000 lb|Shank Size=2.5 in|Finish=Powder coat</code></div>
          <div className="mt-5 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><b>Safe by default:</b> every imported product is created as a draft. Review its images, text, and specifications in the Product Library before publishing it.</div>
        </div>
      </details>

      <CsvImporter mode="product" action={importProducts} primary={brand.primary_color} />
    </main>
  </div>;
}
