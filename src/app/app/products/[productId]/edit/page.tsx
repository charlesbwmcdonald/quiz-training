import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductEditor from "../../product-editor";
import { ContentEditWarnings, ContentGovernanceDetails, type ContentGovernanceRecord } from "@/components/content-governance";
import { ContentGovernancePanel } from "@/components/content-governance-panel";
import type { ContentReviewEvent, ContentSchedule, ContentVersion } from "@/components/content-governance";

type ProductOption = { product_id: string; name: string; is_family: boolean; parent_product_id: string | null };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams:Promise<{error?:string;reviewed?:string;restored?:string;scheduled?:string;cancelled?:string;templateSaved?:string;fromTemplate?:string}> }) {
  const { productId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand, { data }, { data: products }, { data: governanceRows }, {data:versions}, {data:reviews}, {data:scheduleRows}] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
    supabase.rpc("get_manufacturer_product", { target_id: productId }),
    supabase.rpc("manufacturer_products_v2"),
    supabase.rpc("manufacturer_content_governance"),
    supabase.rpc("content_version_history",{content_type:"product",target_content_id:productId}),
    supabase.rpc("content_review_history",{content_type:"product",target_content_id:productId}),
    supabase.rpc("manufacturer_content_schedules"),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training || !data) notFound();

  const parentOptions = ((products ?? []) as ProductOption[]).filter((product) => product.is_family && !product.parent_product_id && product.product_id !== productId);
  const governance = ((governanceRows ?? []) as ContentGovernanceRecord[]).find((item) => item.content_type === "product" && item.content_id === productId);

  return <div className="min-h-screen bg-[#f4f4f2]">
    <ManufacturerHeader brand={brand} email={auth.user.email} />
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link href={`/m/${brand.slug}/app/products`} className="font-bold text-black/50">← Products</Link>
      <p className="mt-7 text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Product editor</p>
      <h1 className="mt-2 text-4xl font-extrabold uppercase">Edit {data.name}</h1>
      <ContentGovernanceDetails record={governance}/>
      <ContentEditWarnings status={data.status} assignmentCount={Number(governance?.assignment_count ?? 0)} noun="product"/>
      <ContentGovernancePanel contentType="product" contentId={productId} status={data.status} returnTo={`/app/products/${productId}/edit`} canReview={Boolean(brand.can_manage_brand)} versions={(versions??[]) as ContentVersion[]} reviews={(reviews??[]) as ContentReviewEvent[]} schedules={((scheduleRows??[]) as ContentSchedule[]).filter(item=>item.content_type==="product"&&item.content_id===productId)} message={query.error?{kind:"error",text:query.error}:query.templateSaved?{kind:"success",text:"Template saved to your academy library."}:query.fromTemplate?{kind:"success",text:"Fresh draft created from the template. Review and customize it before publishing."}:query.restored?{kind:"success",text:"Previous version restored as a draft."}:query.reviewed?{kind:"success",text:query.reviewed==="approved"?"Content approved and published.":"Content returned to draft with reviewer notes."}:query.scheduled?{kind:"success",text:"Content schedule saved."}:query.cancelled?{kind:"success",text:"Scheduled action cancelled."}:undefined}/>
      <ProductEditor primary={brand.primary_color} initial={data} parentOptions={parentOptions} />
    </main>
  </div>;
}
