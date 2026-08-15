"use client";

import { useState } from "react";
import { saveProduct } from "./actions";

type Spec = { id: string; label: string; value: string };
type Option = { id: string; label: string; value: string };
type ParentOption = { product_id: string; name: string };
type ProductMode = "standalone" | "family" | "variation";

type Initial = {
  id?: string;
  name?: string;
  slug?: string;
  category_name?: string;
  model_sku?: string;
  tagline?: string;
  description?: string;
  images?: { url: string }[];
  features?: string[];
  specs?: { label: string; value: string }[];
  compatibility?: string;
  videos?: { url: string }[];
  downloads?: { url: string }[];
  product_url?: string;
  status?: string;
  parent_product_id?: string | null;
  is_family?: boolean;
  variation_label?: string | null;
  variation_options?: Record<string, string>;
};

const uid = () => Math.random().toString(36).slice(2);

function modeFor(initial?: Initial): ProductMode {
  if (initial?.parent_product_id) return "variation";
  if (initial?.is_family) return "family";
  return "standalone";
}

export default function ProductEditor({
  primary,
  initial,
  parentOptions = [],
}: {
  primary: string;
  initial?: Initial;
  parentOptions?: ParentOption[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [mode, setMode] = useState<ProductMode>(modeFor(initial));
  const [parentId, setParentId] = useState(initial?.parent_product_id ?? "");
  const [specs, setSpecs] = useState<Spec[]>(
    initial?.specs?.length
      ? initial.specs.map((spec) => ({ ...spec, id: uid() }))
      : [{ id: uid(), label: "", value: "" }],
  );
  const [options, setOptions] = useState<Option[]>(() => {
    const entries = Object.entries(initial?.variation_options ?? {});
    return entries.length
      ? entries.map(([label, value]) => ({ id: uid(), label, value }))
      : [{ id: uid(), label: "", value: "" }];
  });

  const variationOptions = Object.fromEntries(
    options
      .filter((option) => option.label.trim() && option.value.trim())
      .map((option) => [option.label.trim(), option.value.trim()]),
  );

  return (
    <form action={saveProduct} className="mt-8 grid gap-6">
      <input type="hidden" name="productId" value={initial?.id ?? ""} />
      <input type="hidden" name="productMode" value={mode} />
      <input type="hidden" name="parentProductId" value={mode === "variation" ? parentId : ""} />
      <input
        type="hidden"
        name="specs"
        value={JSON.stringify(specs.filter((spec) => spec.label || spec.value).map(({ label, value }) => ({ label, value })))}
      />
      <input type="hidden" name="variationOptions" value={JSON.stringify(variationOptions)} />

      <section className="border border-black/10 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-extrabold uppercase">Product structure</h2>
        <p className="mt-2 text-sm leading-6 text-black/55">
          Use a family as the shared product shell, then add sellable variations beneath it.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {([
            ["standalone", "Standalone", "One product with no variations."],
            ["family", "Product family", "Shared content and a public variation selector."],
            ["variation", "Variation", "A selectable SKU or configuration within a family."],
          ] as const).map(([value, label, description]) => (
            <label
              key={value}
              className={`cursor-pointer border-2 p-4 ${mode === value ? "border-black bg-black text-white" : "border-black/10"}`}
            >
              <span className="flex items-center gap-2 font-extrabold uppercase">
                <input type="radio" checked={mode === value} onChange={() => setMode(value)} />
                {label}
              </span>
              <span className={`mt-2 block text-xs leading-5 ${mode === value ? "text-white/65" : "text-black/50"}`}>
                {description}
              </span>
            </label>
          ))}
        </div>

        {mode === "variation" && (
          <div className="mt-6 border-l-4 bg-black/[.035] p-5" style={{ borderColor: primary }}>
            <label className="grid gap-2 font-bold">
              Parent product family
              <select
                name="parentProductSelect"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                required
                className="min-h-12 border bg-white px-4 font-normal"
              >
                <option value="">Choose a product family…</option>
                {parentOptions.map((parent) => (
                  <option key={parent.product_id} value={parent.product_id}>{parent.name}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 grid gap-2 font-bold">
              Variation display name
              <input
                name="variationLabel"
                defaultValue={initial?.variation_label ?? ""}
                placeholder='Example: 2.5" Shank · 21K'
                required
                className="min-h-12 border bg-white px-4 font-normal"
              />
            </label>
            <fieldset className="mt-4">
              <legend className="font-bold">Variation attributes</legend>
              <p className="mt-1 text-xs text-black/50">Add attributes in selection order, such as Weight Rating, Drop, then Shank. Up to three dependent levels are supported.</p>
              <div className="mt-3 grid gap-2">
                {options.map((option) => (
                  <div key={option.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      value={option.label}
                      onChange={(event) => setOptions((all) => all.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item))}
                      placeholder="Shank size"
                      className="min-h-11 border bg-white px-3"
                    />
                    <input
                      value={option.value}
                      onChange={(event) => setOptions((all) => all.map((item) => item.id === option.id ? { ...item, value: event.target.value } : item))}
                      placeholder='2.5"'
                      className="min-h-11 border bg-white px-3"
                    />
                    <button type="button" onClick={() => setOptions((all) => all.filter((item) => item.id !== option.id))} className="px-3 font-bold">×</button>
                  </div>
                ))}
              </div>
              {options.length < 3 && <button type="button" onClick={() => setOptions((all) => [...all, { id: uid(), label: "", value: "" }])} className="mt-3 text-sm font-extrabold uppercase" style={{ color: primary }}>
                + Add attribute
              </button>}
            </fieldset>
          </div>
        )}
      </section>

      <section className="border border-black/10 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-extrabold uppercase">Product identity</h2>
        {mode === "variation" && <p className="mt-2 text-sm text-black/50">Variation-specific content overrides the family. Leave optional sections blank to inherit the shared family content.</p>}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-bold">Product name<input name="name" value={name} onChange={(event) => { setName(event.target.value); if (!initial?.id) setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} required className="min-h-12 border px-4 font-normal" /></label>
          <label className="grid gap-2 font-bold">URL slug<input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required className="min-h-12 border px-4 font-normal" /></label>
          <label className="grid gap-2 font-bold">Category<input name="category" defaultValue={initial?.category_name} placeholder="Bumper Towing" className="min-h-12 border px-4 font-normal" /></label>
          <label className="grid gap-2 font-bold">Model / SKU<input name="modelSku" defaultValue={initial?.model_sku} className="min-h-12 border px-4 font-normal" /></label>
        </div>
        <label className="mt-5 grid gap-2 font-bold">Positioning statement<input name="tagline" defaultValue={initial?.tagline} className="min-h-12 border px-4 font-normal" /></label>
        <label className="mt-5 grid gap-2 font-bold">Product overview<textarea name="description" defaultValue={initial?.description} rows={6} className="border p-4 font-normal" /></label>
      </section>

      <section className="border border-black/10 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-extrabold uppercase">Sales knowledge</h2>
        <label className="mt-5 grid gap-2 font-bold">Image URLs <span className="text-xs font-normal text-black/45">One per line</span><textarea name="images" defaultValue={initial?.images?.map((item) => item.url).join("\n")} rows={4} className="border p-4 font-normal" /></label>
        <label className="mt-5 grid gap-2 font-bold">Features & selling points <span className="text-xs font-normal text-black/45">One per line</span><textarea name="features" defaultValue={initial?.features?.join("\n")} rows={5} className="border p-4 font-normal" /></label>
        <fieldset className="mt-5">
          <legend className="font-bold">Specifications</legend>
          <div className="mt-2 grid gap-2">
            {specs.map((spec) => (
              <div key={spec.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input value={spec.label} onChange={(event) => setSpecs((all) => all.map((item) => item.id === spec.id ? { ...item, label: event.target.value } : item))} placeholder="Capacity" className="min-h-11 border px-3" />
                <input value={spec.value} onChange={(event) => setSpecs((all) => all.map((item) => item.id === spec.id ? { ...item, value: event.target.value } : item))} placeholder="21,000 lb" className="min-h-11 border px-3" />
                <button type="button" onClick={() => setSpecs((all) => all.filter((item) => item.id !== spec.id))} className="px-3 font-bold">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSpecs((all) => [...all, { id: uid(), label: "", value: "" }])} className="mt-3 text-sm font-extrabold uppercase" style={{ color: primary }}>+ Add specification</button>
        </fieldset>
        <label className="mt-5 grid gap-2 font-bold">Compatibility & fitment<textarea name="compatibility" defaultValue={initial?.compatibility} rows={4} className="border p-4 font-normal" /></label>
      </section>

      <section className="border border-black/10 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-extrabold uppercase">Media & resources</h2>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 font-bold">Video URLs <span className="text-xs font-normal text-black/45">One per line</span><textarea name="videos" defaultValue={initial?.videos?.map((item) => item.url).join("\n")} rows={3} className="border p-4 font-normal" /></label>
          <label className="grid gap-2 font-bold">Manual / download URLs <span className="text-xs font-normal text-black/45">One per line</span><textarea name="downloads" defaultValue={initial?.downloads?.map((item) => item.url).join("\n")} rows={3} className="border p-4 font-normal" /></label>
          <label className="grid gap-2 font-bold">Official product URL<input name="productUrl" type="url" defaultValue={initial?.product_url} className="min-h-12 border px-4 font-normal" /></label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button name="intent" value="draft" className="min-h-12 border-2 border-black px-6 font-bold uppercase">Save draft</button>
        <button name="intent" value="published" className="min-h-12 px-6 font-extrabold uppercase text-white" style={{ backgroundColor: primary }}>Save & publish</button>
      </div>
    </form>
  );
}
