"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { archiveProduct, duplicateProduct } from "./actions";
import ProductDeleteButton from "./product-delete-button";

export type LibraryProduct = {
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
  variations: LibraryProduct[];
};

const statusClass = (status:string) => status === "published" ? "bg-green-100 text-green-800" : status === "archived" ? "bg-black/10 text-black/50" : "bg-amber-100 text-amber-900";
const statusLabel = (status:string) => status === "published" ? "Live" : status;

function ProductActions({ product, manufacturerSlug, primary, variationCount = 0 }: { product:LibraryProduct; manufacturerSlug:string; primary:string; variationCount?:number }) {
  const previewHref=`/m/${manufacturerSlug}/app/products/${product.product_id}/preview`;
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-extrabold uppercase">
    {product.status === "published" && <Link href={`/m/${manufacturerSlug}/products/${product.slug}`} target="_blank">View live ↗</Link>}
    <Link href={previewHref} target="_blank">Preview ↗</Link>
    <Link href={`/m/${manufacturerSlug}/app/products/${product.product_id}/edit`}>Edit</Link>
    {product.is_family && <Link href={`/m/${manufacturerSlug}/app/products/new?parentId=${product.product_id}`} style={{color:primary}}>+ Variation</Link>}
    <form action={duplicateProduct}><input type="hidden" name="productId" value={product.product_id}/><button>Duplicate</button></form>
    {product.status !== "archived" && <form action={archiveProduct}><input type="hidden" name="productId" value={product.product_id}/><button className="text-red-700">Archive</button></form>}
    <ProductDeleteButton productId={product.product_id} productName={product.variation_label || product.name} variationCount={variationCount}/>
  </div>;
}

function VariationRows({ product, manufacturerSlug, primary, compact = false }: { product:LibraryProduct; manufacturerSlug:string; primary:string; compact?:boolean }) {
  return product.variations.length ? <div className={compact ? "divide-y divide-black/5" : "mt-3 grid gap-2"}>
    {product.variations.map((variation)=>{const options=Object.entries(variation.variation_options ?? {});return <article key={variation.product_id} className={`${compact ? "bg-black/[.018] sm:ml-14" : "border bg-white"} overflow-hidden`}>
      <div className={compact ? "px-5 py-3" : "p-3"}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><b className="block text-sm">{variation.variation_label || variation.name}</b><span className="mt-0.5 block text-xs text-black/45">{variation.model_sku || "No SKU"}</span></div>
          <span className={`shrink-0 px-2 py-1 text-[10px] font-extrabold uppercase ${statusClass(variation.status)}`}>{statusLabel(variation.status)}</span>
        </div>
        {options.length > 0 && <div className="mt-2.5 grid gap-px overflow-hidden border border-black/10 bg-black/10">
          {options.map(([label,value])=><div key={label} className="grid min-h-8 items-center gap-0.5 bg-white px-3 py-1.5 sm:grid-cols-[minmax(120px,.35fr)_minmax(0,1fr)] sm:gap-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-black/45">{label}</span><span className="min-w-0 break-words text-xs font-bold sm:text-right">{value}</span>
          </div>)}
        </div>}
      </div>
      <div className={`${compact ? "px-5" : "px-3"} border-t border-black/10 py-2.5`}><ProductActions product={variation} manufacturerSlug={manufacturerSlug} primary={primary}/></div>
    </article>})}
  </div> : <p className={`${compact ? "px-5 py-5 sm:pl-14" : "mt-3 border border-dashed p-4"} text-sm text-black/45`}>No variations yet. Add the first selectable SKU or configuration.</p>;
}

export default function ProductLibraryView({ products, manufacturerSlug, primary }: { products:LibraryProduct[]; manufacturerSlug:string; primary:string }) {
  const storageKey=`jobbertrain-product-library-view:${manufacturerSlug}`;
  const [view,setView]=useState<"cards"|"list">("cards");
  const [expanded,setExpanded]=useState<Set<string>>(new Set());
  useEffect(()=>{const saved=window.localStorage.getItem(storageKey);if(saved==="cards"||saved==="list")setView(saved)},[storageKey]);
  const choose=(next:"cards"|"list")=>{setView(next);window.localStorage.setItem(storageKey,next)};
  const toggle=(id:string)=>setExpanded((current)=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next});

  return <>
    <div className="mt-5 flex items-center justify-between gap-4">
      <p className="text-sm text-black/45"><b className="text-black">{products.length}</b> {products.length===1?"product":"products"}</p>
      <div className="flex border border-black/15 bg-white p-1" aria-label="Product library view">
        <button type="button" aria-pressed={view==="cards"} onClick={()=>choose("cards")} className={`min-h-9 px-4 text-xs font-extrabold uppercase ${view==="cards"?"bg-black text-white":"text-black/45"}`}>Cards</button>
        <button type="button" aria-pressed={view==="list"} onClick={()=>choose("list")} className={`min-h-9 px-4 text-xs font-extrabold uppercase ${view==="list"?"bg-black text-white":"text-black/45"}`}>List</button>
      </div>
    </div>

    {view === "cards" ? <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {products.map((product)=>{const previewHref=`/m/${manufacturerSlug}/app/products/${product.product_id}/preview`;return <article key={product.product_id} className="overflow-hidden border border-black/10 bg-white">
        <div className="grid sm:grid-cols-[190px_1fr]">
          <Link href={previewHref} aria-label={`Preview ${product.name}`} className="block">{product.primary_image?<Image src={product.primary_image} alt="" width={640} height={480} unoptimized className="h-full min-h-48 w-full object-cover"/>:<div className="grid min-h-48 place-items-center bg-black/5 text-sm font-bold uppercase text-black/35">No image</div>}</Link>
          <div className="p-5"><div className="flex flex-wrap justify-between gap-3"><span className="text-xs font-bold uppercase" style={{color:primary}}>{product.category_name||"Uncategorized"}</span><span className="flex flex-wrap justify-end gap-2"><span className="bg-black/5 px-2 py-1 text-[10px] font-extrabold uppercase text-black/50">{product.is_family?`Family · ${product.variations.length} variations`:"Product"}</span><span className={`px-2 py-1 text-[10px] font-extrabold uppercase ${statusClass(product.status)}`}>{statusLabel(product.status)}</span></span></div><h2 className="mt-3 text-xl font-extrabold uppercase"><Link href={previewHref} className="hover:underline">{product.name}</Link></h2>{product.model_sku&&<p className="mt-1 text-xs font-bold uppercase text-black/40">{product.model_sku}</p>}<p className="mt-3 text-sm leading-6 text-black/60">{product.tagline||"Product knowledge profile"}</p><p className="mt-4 border-t pt-3 text-sm"><b>{product.course_count}</b> course references</p></div>
        </div>
        <div className="border-t border-black/10 px-5 py-3"><ProductActions product={product} manufacturerSlug={manufacturerSlug} primary={primary} variationCount={product.variations.length}/></div>
        {product.is_family&&<div className="border-t bg-black/[.025] p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-black/50">Variations</h3><Link href={`/m/${manufacturerSlug}/app/products/new?parentId=${product.product_id}`} className="text-xs font-extrabold uppercase">Add variation →</Link></div><VariationRows product={product} manufacturerSlug={manufacturerSlug} primary={primary}/></div>}
      </article>})}
    </div> : <div className="mt-4 overflow-hidden border border-black/10 bg-white">
      <div className="hidden grid-cols-[minmax(260px,1.5fr)_120px_150px_130px_90px_110px] gap-4 bg-black px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-white lg:grid"><span>Product</span><span>Type</span><span>Category</span><span>SKU</span><span>Variants</span><span>Status</span></div>
      {products.map((product)=>{const open=expanded.has(product.product_id);return <article key={product.product_id} className="border-t border-black/10 first:border-0">
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(260px,1.5fr)_120px_150px_130px_90px_110px] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">{product.is_family?<button type="button" onClick={()=>toggle(product.product_id)} aria-expanded={open} className="grid h-8 w-8 shrink-0 place-items-center border font-black">{open?"−":"+"}</button>:<span className="h-8 w-8 shrink-0"/>}<div className="min-w-0"><Link href={`/m/${manufacturerSlug}/app/products/${product.product_id}/preview`} className="font-extrabold uppercase hover:underline">{product.name}</Link><p className="mt-1 truncate text-xs text-black/45">{product.tagline||"Product knowledge profile"}</p></div></div>
          <span className="text-sm"><span className="mr-2 text-[10px] font-bold uppercase text-black/35 lg:hidden">Type</span>{product.is_family?"Family":"Product"}</span><span className="truncate text-sm"><span className="mr-2 text-[10px] font-bold uppercase text-black/35 lg:hidden">Category</span>{product.category_name||"Uncategorized"}</span><span className="text-sm"><span className="mr-2 text-[10px] font-bold uppercase text-black/35 lg:hidden">SKU</span>{product.model_sku||" - "}</span><span className="text-sm"><span className="mr-2 text-[10px] font-bold uppercase text-black/35 lg:hidden">Variants</span>{product.is_family?product.variations.length:" - "}</span><span><span className={`px-2 py-1 text-[10px] font-extrabold uppercase ${statusClass(product.status)}`}>{statusLabel(product.status)}</span></span>
        </div>
        <div className="border-t border-black/5 px-5 py-3 sm:pl-16"><ProductActions product={product} manufacturerSlug={manufacturerSlug} primary={primary} variationCount={product.variations.length}/></div>
        {product.is_family&&open&&<VariationRows product={product} manufacturerSlug={manufacturerSlug} primary={primary} compact/>}
      </article>})}
    </div>}
  </>;
}
