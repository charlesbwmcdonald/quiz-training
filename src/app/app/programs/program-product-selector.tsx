"use client";

import {useMemo,useState} from "react";

export type ProgramProduct={
  product_id:string;
  name:string;
  model_sku:string|null;
  status:string;
  is_family:boolean;
  parent_product_id?:string|null;
  category_name?:string|null;
  variation_label?:string|null;
  variation_options?:Record<string,string>|null;
};

const statusLabel=(status:string)=>status==="published"?"Live":status;
const statusClass=(status:string)=>status==="published"?"bg-green-100 text-green-800":status==="archived"?"bg-black/10 text-black/50":"bg-amber-100 text-amber-900";

export default function ProgramProductSelector({products,initialSelectedIds}:{products:ProgramProduct[];initialSelectedIds:string[]}){
  const[query,setQuery]=useState("");
  const[selectedIds,setSelectedIds]=useState(()=>new Set(initialSelectedIds));
  const visibleProducts=useMemo(()=>{
    const search=query.trim().toLowerCase();
    return search?products.filter(product=>[
      product.name,product.model_sku,product.category_name,product.variation_label,
      ...Object.entries(product.variation_options??{}).flatMap(([label,value])=>[label,value]),
    ].some(value=>value?.toLowerCase().includes(search))):products;
  },[products,query]);
  const visibleIds=visibleProducts.map(product=>product.product_id);
  const allVisibleSelected=visibleIds.length>0&&visibleIds.every(id=>selectedIds.has(id));
  const toggleProduct=(id:string,checked:boolean)=>setSelectedIds(current=>{const next=new Set(current);if(checked)next.add(id);else next.delete(id);return next});
  const toggleVisible=(checked:boolean)=>setSelectedIds(current=>{const next=new Set(current);visibleIds.forEach(id=>checked?next.add(id):next.delete(id));return next});

  return <>
    {[...selectedIds].map(id=><input key={id} type="hidden" name="productIds" value={id}/>)}
    <label className="mt-5 grid gap-1 text-xs font-extrabold uppercase tracking-wide text-black/45">Search related products<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Name, SKU, category, family, or variation..." className="min-h-11 border border-black/20 px-3 text-sm font-normal normal-case tracking-normal text-black outline-none focus:border-black"/></label>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-black/40">Products <span className="ml-2 normal-case tracking-normal">{visibleProducts.length} shown · {selectedIds.size} selected</span></p>
      {!!visibleProducts.length&&<label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold uppercase"><input type="checkbox" checked={allVisibleSelected} onChange={event=>toggleVisible(event.target.checked)} className="h-4 w-4"/>Select all shown</label>}
    </div>
    <div className="mt-2 max-h-96 overflow-auto border border-black/10">
      {!!products.length&&<div className="sticky top-0 z-10 hidden grid-cols-[32px_minmax(240px,1.5fr)_minmax(150px,1fr)_140px_120px] items-center gap-4 border-b border-black/10 bg-[#f7f7f5] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wide text-black/40 lg:grid"><span/><span>Product</span><span>Category</span><span>SKU</span><span>Status</span></div>}
      {visibleProducts.map(product=>{const type=product.is_family?"Product family":product.parent_product_id?"Variation":"Standalone product";const options=Object.values(product.variation_options??{}).filter(Boolean).join(" · ");return <label key={product.product_id} className="grid cursor-pointer gap-3 border-b border-black/10 p-4 last:border-0 hover:bg-black/[.02] lg:grid-cols-[32px_minmax(240px,1.5fr)_minmax(150px,1fr)_140px_120px] lg:items-center lg:gap-4"><input type="checkbox" checked={selectedIds.has(product.product_id)} onChange={event=>toggleProduct(product.product_id,event.target.checked)} className="h-5 w-5"/><div className="min-w-0"><b className="block uppercase">{product.variation_label||product.name}</b><span className="mt-1 block truncate text-xs text-black/45">{type}{options?` · ${options}`:""}</span></div><span className="text-sm"><span className="mr-2 text-[10px] font-bold uppercase text-black/35 lg:hidden">Category</span>{product.category_name||"Uncategorized"}</span><span className="text-sm"><span className="mr-2 text-[10px] font-bold uppercase text-black/35 lg:hidden">SKU</span>{product.model_sku||"No SKU"}</span><span><span className={`px-2 py-1 text-[10px] font-extrabold uppercase ${statusClass(product.status)}`}>{statusLabel(product.status)}</span></span></label>})}
      {!visibleProducts.length&&<p className="p-5 text-sm text-black/50">No products match this search. Clear the search to see all available products.</p>}
    </div>
  </>;
}
