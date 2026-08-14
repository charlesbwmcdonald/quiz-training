import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LandingExperience } from "@/lib/branding";
import { updateBranding } from "./actions";
import BrandColorField from "./brand-color-field";
import PageBuilder from "@/components/page-builder";
import type { LandingSection } from "@/lib/branding";

type Brand = { id:string; name:string; slug:string; logo_url:string|null; primary_color:string; secondary_color:string; landing_headline:string|null; landing_description:string|null; hero_image_url:string|null; hero_overlay:number; hero_alignment:string; hero_height:string; hero_cta_text:string; promo_enabled:boolean; promo_text:string|null; landing_experience:LandingExperience };
type Product = { product_id:string; name:string; status:string; category_name:string|null; parent_product_id:string|null; is_family:boolean; variation_count:number };
const input = "min-h-12 border border-black/20 px-4 font-normal outline-none focus:border-black";
const area = "border border-black/20 p-4 font-normal outline-none focus:border-black";

export default async function BrandingSettingsPage({ searchParams }: { searchParams: Promise<{error?:string;saved?:string;mode?:string}> }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("active_manufacturer_id").eq("id", auth.user.id).single();
  if (!profile?.active_manufacturer_id) redirect("/app");
  const [{ data }, { data: productRows }] = await Promise.all([
    supabase.from("manufacturers").select("id,name,slug,logo_url,primary_color,secondary_color,landing_headline,landing_description,hero_image_url,hero_overlay,hero_alignment,hero_height,hero_cta_text,promo_enabled,promo_text,landing_experience").eq("id", profile.active_manufacturer_id).single(),
    supabase.rpc("manufacturer_products_v2"),
  ]);
  const brand = data as Brand | null;
  if (!brand) redirect("/app");
  const experience = brand.landing_experience ?? {};
  const products = ((productRows ?? []) as Product[]).filter((product) => product.status === "published" && !product.parent_product_id);
  const defaultSections: LandingSection[] = [
    { id:"announcement-default", type:"announcement", enabled:Boolean(brand.promo_enabled), config:{ messages:(experience.announcements ?? []).map((item)=>`${item.text}${item.url?` | ${item.url}`:""}`).join("\n") || brand.promo_text || "New training is now available" } },
    { id:"hero-default", type:"hero", enabled:true, config:{ headline:brand.landing_headline ?? "Product knowledge that drives sales.", description:brand.landing_description ?? "Learn the products and build customer confidence.", button_text:brand.hero_cta_text || "Start training", link_url:`/login?brand=${brand.slug}`, image_url:brand.hero_image_url ?? "", overlay:String(brand.hero_overlay ?? 60), alignment:brand.hero_alignment === "center" ? "center" : "left", height:["compact","large","full"].includes(brand.hero_height) ? brand.hero_height : "large" } },
    { id:"benefits-default", type:"benefits", enabled:true, config:{ title:"Build product confidence" } },
  ];
  const savedSections = experience.draft_sections?.length ? experience.draft_sections : experience.published_sections?.length ? experience.published_sections : defaultSections;
  const builderSections = savedSections.map((section) => section.type === "hero" ? { ...section, config:{ image_url:brand.hero_image_url ?? "", overlay:String(brand.hero_overlay ?? 60), alignment:brand.hero_alignment === "center" ? "center" : "left", height:["compact","large","full"].includes(brand.hero_height) ? brand.hero_height : "large", ...section.config } } : section);

  return <main className="min-h-screen bg-[#f4f4f2] px-5 py-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap justify-between gap-4"><Link href={`/m/${brand.slug}/app`} className="text-sm font-bold uppercase text-black/55">← Training center</Link><Link href={`/m/${brand.slug}`} target="_blank" className="text-sm font-extrabold uppercase" style={{ color: brand.primary_color }}>View landing page ↗</Link></div>
    <p className="mt-8 text-sm font-extrabold uppercase tracking-[.2em]" style={{ color: brand.primary_color }}>Manufacturer settings</p><h1 className="mt-2 text-4xl font-extrabold uppercase sm:text-5xl">Brand Studio</h1><p className="mt-3 max-w-2xl text-black/60">Control your identity, sign-in experience, landing-page content, featured products, and promotions.</p>
    {params.error && <div className="mt-6 bg-red-50 p-4 text-red-900">{params.error}</div>}{params.saved && <div className="mt-6 bg-green-50 p-4 font-bold text-green-900">{params.mode === "publish" ? "Landing page published successfully." : "Draft saved successfully."}</div>}
    <form action={updateBranding} className="mt-8 grid gap-6"><input type="hidden" name="manufacturerId" value={brand.id}/><input type="hidden" name="slug" value={brand.slug}/>
      <section className="border border-black/10 bg-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-black/40">01 · Identity</p><h2 className="mt-2 text-2xl font-extrabold uppercase">Brand identity</h2><div className="mt-6 grid gap-5"><label className="grid gap-2 font-bold">Manufacturer name<input name="name" defaultValue={brand.name} required className={input}/></label><label className="grid gap-2 font-bold">Logo <span className="text-xs font-normal text-black/45">PNG, JPG, or WebP</span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="min-h-12 border p-3 font-normal"/></label><div className="grid gap-5 sm:grid-cols-2"><BrandColorField label="Primary color" name="primaryColor" initialValue={brand.primary_color}/><BrandColorField label="Secondary color" name="secondaryColor" initialValue={brand.secondary_color}/></div></div></section>

      <section className="border border-black/10 bg-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-black/40">02 · Sign in</p><h2 className="mt-2 text-2xl font-extrabold uppercase">Branded sign-in experience</h2><p className="mt-2 text-sm text-black/55">Displayed when learners sign in through this manufacturer’s landing page.</p><div className="mt-6 grid gap-5"><label className="grid gap-2 font-bold">Sign-in background image<input name="loginImage" type="file" accept="image/png,image/jpeg,image/webp" className="min-h-12 border p-3 font-normal"/></label><label className="grid gap-2 font-bold">Welcome headline<input name="loginHeadline" maxLength={120} defaultValue={experience.login?.headline ?? "Welcome to your training center"} className={input}/></label><label className="grid gap-2 font-bold">Welcome message<textarea name="loginDescription" maxLength={400} rows={3} defaultValue={experience.login?.description ?? "Sign in to continue your product training."} className={area}/></label></div></section>

      <PageBuilder initialSections={builderSections} products={products} primary={brand.primary_color}/>
      <div className="sticky bottom-4 flex flex-wrap justify-end gap-3"><button name="intent" value="draft" className="min-h-14 border-2 border-black bg-white px-8 font-extrabold uppercase text-black shadow-xl">Save draft</button><button name="intent" value="publish" className="min-h-14 px-8 font-extrabold uppercase text-white shadow-xl" style={{ backgroundColor: brand.primary_color }}>Publish landing page</button></div>
    </form>
  </div></main>;
}
