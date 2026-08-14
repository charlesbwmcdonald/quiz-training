"use client";

import { useMemo, useState } from "react";
import { ImageLightbox } from "@/components/image-lightbox";

export type ProductDetail = {
  id?: string;
  name: string;
  tagline: string | null;
  description: string | null;
  model_sku: string | null;
  category_name: string | null;
  images: { url: string; caption?: string }[];
  features: string[];
  specs: { label: string; value: string }[];
  compatibility: string | null;
  videos: { url: string }[];
  downloads: { url: string }[];
  product_url: string | null;
  variation_label?: string | null;
  variation_options?: Record<string, string>;
  status?: string;
};

const text = (variation: ProductDetail | undefined, parent: ProductDetail, key: "name" | "tagline" | "description" | "model_sku" | "category_name" | "compatibility" | "product_url") => {
  const value = variation?.[key];
  return typeof value === "string" && value.trim() ? value : parent[key];
};

const list = <T,>(variation: ProductDetail | undefined, parent: ProductDetail, key: "images" | "features" | "specs" | "videos" | "downloads") => {
  const value = variation?.[key] as T[] | undefined;
  return value?.length ? value : parent[key] as T[];
};

export function ProductVariationViewer({ parent, variations, primary }: { parent: ProductDetail; variations: ProductDetail[]; primary: string }) {
  const [selectedId, setSelectedId] = useState(variations[0]?.id ?? "");
  const variation = useMemo(() => variations.find((item) => item.id === selectedId), [selectedId, variations]);
  const product = {
    name: text(variation, parent, "name") ?? parent.name,
    tagline: text(variation, parent, "tagline"),
    description: text(variation, parent, "description"),
    model_sku: text(variation, parent, "model_sku"),
    category_name: text(variation, parent, "category_name"),
    compatibility: text(variation, parent, "compatibility"),
    product_url: text(variation, parent, "product_url"),
    images: list<{ url: string; caption?: string }>(variation, parent, "images"),
    features: list<string>(variation, parent, "features"),
    specs: list<{ label: string; value: string }>(variation, parent, "specs"),
    videos: list<{ url: string }>(variation, parent, "videos"),
    downloads: list<{ url: string }>(variation, parent, "downloads"),
  };

  return <>
    {variations.length > 0 && <section className="border-b bg-white px-5 py-7">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.18em]" style={{ color: primary }}>Choose your configuration</p><h2 className="mt-2 text-2xl font-extrabold uppercase">Available variations</h2></div>
          {product.model_sku && <p className="text-sm"><span className="text-black/45">Selected SKU</span> <b>{product.model_sku}</b></p>}
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {variations.map((item) => {
            const selected = item.id === selectedId;
            return <button key={item.id} type="button" onClick={() => setSelectedId(item.id ?? "")} className={`min-w-52 border-2 p-4 text-left transition ${selected ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}>
              <b className="block uppercase">{item.variation_label || item.name}</b>
              {item.model_sku && <span className={`mt-1 block text-xs ${selected ? "text-white/55" : "text-black/45"}`}>{item.model_sku}</span>}
              {Object.keys(item.variation_options ?? {}).length > 0 && <span className="mt-3 grid gap-1">{Object.entries(item.variation_options ?? {}).map(([label, value]) => <span key={label} className="text-xs"><span className={selected ? "text-white/50" : "text-black/45"}>{label}:</span> {value}</span>)}</span>}
            </button>;
          })}
        </div>
      </div>
    </section>}

    <section className="bg-[#f4f4f2] px-5 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: primary }}>{product.category_name || "Product"}</p>
        <h1 className="mt-3 text-5xl font-extrabold uppercase sm:text-6xl">{product.name}</h1>
        {variation?.variation_label && <p className="mt-3 text-lg font-bold uppercase" style={{ color: primary }}>{variation.variation_label}</p>}
        {product.tagline && <p className="mt-4 max-w-3xl text-xl text-black/60">{product.tagline}</p>}
      </div>
    </section>

    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <ImageLightbox key={variation?.id ?? "parent"} images={product.images ?? []} alt={product.name} className="grid grid-cols-2 gap-3 [&_button:first-child]:col-span-2 [&_button]:aspect-[4/3]" />
        {product.videos?.length > 0 && <div className="mt-8"><h2 className="text-2xl font-extrabold uppercase">Videos</h2><div className="mt-4 grid gap-3">{product.videos.map((video, index) => <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="border-2 border-black p-4 font-bold uppercase">Watch video {index + 1} ↗</a>)}</div></div>}
      </div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-2xl font-extrabold uppercase">Product overview</h2>{product.model_sku && <span className="bg-black px-3 py-2 text-xs font-extrabold uppercase text-white">SKU {product.model_sku}</span>}</div>
        <p className="mt-4 whitespace-pre-wrap leading-8 text-black/70">{product.description}</p>
        {product.features?.length > 0 && <div className="mt-8 border-l-4 bg-black/5 p-6" style={{ borderColor: primary }}><h2 className="font-extrabold uppercase">Key selling points</h2><ul className="mt-4 list-disc space-y-2 pl-5">{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>}
        {product.specs?.length > 0 && <div className="mt-8"><h2 className="font-extrabold uppercase">Specifications</h2><dl className="mt-3 divide-y border-y">{product.specs.map((spec) => <div key={`${spec.label}-${spec.value}`} className="grid grid-cols-2 gap-4 py-3"><dt className="font-bold">{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></div>}
        {product.compatibility && <div className="mt-8"><h2 className="font-extrabold uppercase">Compatibility & fitment</h2><p className="mt-3 whitespace-pre-wrap text-black/70">{product.compatibility}</p></div>}
        <div className="mt-8 flex flex-wrap gap-3">{product.product_url && <a href={product.product_url} target="_blank" rel="noreferrer" className="px-5 py-4 font-extrabold uppercase text-white" style={{ backgroundColor: primary }}>Official product page ↗</a>}{product.downloads?.map((download, index) => <a key={download.url} href={download.url} target="_blank" rel="noreferrer" className="border-2 border-black px-5 py-4 font-extrabold uppercase">Download {index + 1} ↗</a>)}</div>
      </div>
    </div>
  </>;
}
