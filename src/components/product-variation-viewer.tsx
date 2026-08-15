"use client";

import { useMemo, useState } from "react";
import { ImageLightbox } from "@/components/image-lightbox";
import { ProductOptionSelector } from "@/components/product-option-selector";

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
    <section className="bg-[#f4f4f2] px-5 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: primary }}>{product.category_name || "Product"}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><h1 className="text-4xl font-extrabold uppercase sm:text-5xl">{product.name}</h1>{product.model_sku && <span className="bg-black px-3 py-2 text-xs font-extrabold uppercase text-white">SKU {product.model_sku}</span>}</div>
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
        {variations.length > 0 && <section className="border-b border-black/10 pb-7">
          <p className="text-xs font-extrabold uppercase tracking-[.18em]" style={{ color: primary }}>Choose your configuration</p>
          <h2 className="mt-2 text-xl font-extrabold uppercase">Available variations</h2>
          <div className="mt-5"><ProductOptionSelector variations={variations} selectedId={selectedId} onSelect={setSelectedId} compact /></div>
        </section>}
        <div className={variations.length > 0 ? "mt-8" : ""}><h2 className="text-2xl font-extrabold uppercase">Product overview</h2></div>
        <p className="mt-4 whitespace-pre-wrap leading-8 text-black/70">{product.description}</p>
        {product.features?.length > 0 && <div className="mt-8 border-l-4 bg-black/5 p-6" style={{ borderColor: primary }}><h2 className="font-extrabold uppercase">Key selling points</h2><ul className="mt-4 list-disc space-y-2 pl-5">{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>}
        {product.specs?.length > 0 && <div className="mt-8"><h2 className="font-extrabold uppercase">Specifications</h2><dl className="mt-3 divide-y border-y">{product.specs.map((spec) => <div key={`${spec.label}-${spec.value}`} className="grid grid-cols-2 gap-4 py-3"><dt className="font-bold">{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></div>}
        {product.compatibility && <div className="mt-8"><h2 className="font-extrabold uppercase">Compatibility & fitment</h2><p className="mt-3 whitespace-pre-wrap text-black/70">{product.compatibility}</p></div>}
        <div className="mt-8 flex flex-wrap gap-3">{product.product_url && <a href={product.product_url} target="_blank" rel="noreferrer" className="px-5 py-4 font-extrabold uppercase text-white" style={{ backgroundColor: primary }}>Official product page ↗</a>}{product.downloads?.map((download, index) => <a key={download.url} href={download.url} target="_blank" rel="noreferrer" className="border-2 border-black px-5 py-4 font-extrabold uppercase">Download {index + 1} ↗</a>)}</div>
      </div>
    </div>
  </>;
}
