"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = Record<string, string>;
type ExistingProduct = { product_id:string; slug:string; is_family:boolean };
const parts = (value:string) => String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
const pairs = (value:string) => Object.fromEntries(parts(value).map((item) => { const index=item.indexOf("="); return index<0?[item,""]:[item.slice(0,index).trim(),item.slice(index+1).trim()]; }));

export async function importProducts(formData:FormData) {
  let rows:Row[];
  try { rows=JSON.parse(String(formData.get("rows")??"[]")); }
  catch { redirect("/app/products/import?error=The+CSV+data+could+not+be+read."); }

  const supabase=await createSupabaseServerClient();
  const {data:existingRows,error:existingError}=await supabase.rpc("manufacturer_products_v2");
  if(existingError)redirect(`/app/products/import?error=${encodeURIComponent(existingError.message)}`);
  const families=new Map<string,string>();
  for(const product of (existingRows??[]) as ExistingProduct[])if(product.is_family)families.set(product.slug,product.product_id);

  const ordered=[...rows!].sort((a,b)=>(a.product_type?.toLowerCase()==="variation"?1:0)-(b.product_type?.toLowerCase()==="variation"?1:0));
  let count=0;
  for(const row of ordered){
    if(!row.name||!row.slug)continue;
    const productType=(row.product_type||"standalone").toLowerCase();
    const parentSlug=String(row.parent_slug||"").trim().toLowerCase();
    const parentId=productType==="variation"?families.get(parentSlug):undefined;
    if(productType==="variation"&&!parentId)redirect(`/app/products/import?error=${encodeURIComponent(`${row.name}: family "${parentSlug}" was not found.`)}`);
    const specs=parts(row.specs).map((item)=>{const index=item.indexOf("=");return{label:index<0?item:item.slice(0,index).trim(),value:index<0?"":item.slice(index+1).trim()};});
    const {data:id,error}=await supabase.rpc("save_manufacturer_product_v2",{
      target_id:null,product_name:row.name.trim(),product_slug:row.slug.trim().toLowerCase(),category_name:row.category||"",model_sku:row.model_sku||"",tagline:row.tagline||"",description:row.description||"",images:parts(row.image_urls).map((url)=>({url})),features:parts(row.features),specs,compatibility:row.compatibility||"",videos:parts(row.video_urls).map((url)=>({url})),downloads:parts(row.download_urls).map((url)=>({url})),product_url:row.product_url||"",product_status:"draft",product_is_family:productType==="family",product_parent_id:parentId||null,product_variation_label:productType==="variation"?row.variation_label||"":null,product_variation_options:productType==="variation"?pairs(row.variation_options):{},
    });
    if(error)redirect(`/app/products/import?error=${encodeURIComponent(`${row.name}: ${error.message}`)}`);
    if(productType==="family"&&id)families.set(row.slug.trim().toLowerCase(),id as string);
    count++;
  }
  redirect(`/app/products?imported=${count}`);
}
