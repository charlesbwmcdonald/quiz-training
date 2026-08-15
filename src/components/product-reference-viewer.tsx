"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageLightbox } from "@/components/image-lightbox";
import { ProductOptionSelector } from "@/components/product-option-selector";
import type { ProductDetail } from "@/components/product-variation-viewer";

export function ProductReferenceViewer({ product, manufacturerSlug, primary, annotation }: { product: ProductDetail & { slug:string; variations?:ProductDetail[] }; manufacturerSlug:string; primary:string; annotation?:string }) {
  const variations = product.variations ?? [];
  const [selectedId, setSelectedId] = useState(variations[0]?.id ?? "");
  const variation = variations.find((item) => item.id === selectedId);
  const inheritText = (key:"name"|"tagline"|"description") => variation?.[key]?.trim() || product[key];
  const inheritList = <T,>(key:"images"|"features"|"specs") => ((variation?.[key] as T[] | undefined)?.length ? variation?.[key] : product[key]) as T[];
  const name = inheritText("name") ?? product.name;
  const images = inheritList<{url:string}>("images");
  const features = inheritList<string>("features");
  const specs = inheritList<{label:string;value:string}>("specs");

  return <div className="mt-5 grid gap-6">
    <div><p className="text-xs font-extrabold uppercase" style={{color:primary}}>{variation?.category_name || product.category_name || "Product"}</p><h3 className="mt-2 text-3xl font-extrabold uppercase">{name}</h3>{inheritText("tagline")&&<p className="mt-2 text-black/60">{inheritText("tagline")}</p>}</div>
    {variations.length>0&&<div><p className="text-xs font-extrabold uppercase tracking-wide text-black/45">Choose configuration</p><div className="mt-3"><ProductOptionSelector variations={variations} selectedId={selectedId} onSelect={setSelectedId} compact /></div></div>}
    <ImageLightbox key={selectedId||"parent"} images={images??[]} alt={name} className="grid grid-cols-2 gap-2 sm:grid-cols-3 [&_button]:aspect-[4/3]" />
    <p className="whitespace-pre-wrap leading-7 text-black/70">{inheritText("description")}</p>
    {annotation&&<div className="border-l-4 bg-black/5 p-5" style={{borderColor:primary}}><b className="uppercase">Training focus</b><p className="mt-2">{annotation}</p></div>}
    {features?.length>0&&<ul className="list-disc space-y-2 pl-5">{features.map((item)=><li key={item}>{item}</li>)}</ul>}
    {specs?.length>0&&<dl className="divide-y border-y">{specs.map((item)=><div key={`${item.label}-${item.value}`} className="grid grid-cols-2 gap-4 py-3"><dt className="font-bold">{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
    <Link href={`/m/${manufacturerSlug}/products/${product.slug}`} target="_blank" className="justify-self-start border-2 border-black px-5 py-3 text-sm font-extrabold uppercase">View full product ↗</Link>
  </div>;
}
