import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBrand, getPublicLandingExperience } from "@/lib/branding";
import { AnnouncementBar, ProductCarousel } from "@/components/landing-experience";
import LandingPageSections from "@/components/landing-page-sections";

export default async function ManufacturerLandingPage({ params }: { params: Promise<{ manufacturerSlug: string }> }) {
  const { manufacturerSlug } = await params;
  const [brand, experience] = await Promise.all([getPublicBrand(manufacturerSlug), getPublicLandingExperience(manufacturerSlug)]);
  if (!brand) notFound();
  const settings = experience?.settings ?? {};
  const publishedSections = settings.published_sections;
  const announcements = settings.announcements?.length ? settings.announcements : brand.promo_enabled && brand.promo_text ? [{ text: brand.promo_text, url: brand.promo_link_url ?? undefined }] : [];

  return (
    <main className="min-h-screen bg-white text-black">
      {!publishedSections?.length && brand.promo_enabled && <AnnouncementBar announcements={announcements} color={brand.primary_color} />}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href={`/m/${brand.slug}`} className="flex items-center gap-4">
            {brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={190} height={52} className="max-h-12 w-auto object-contain" priority unoptimized /> : <span className="text-xl font-extrabold uppercase">{brand.name}</span>}
            <span className="hidden border-l border-black/20 pl-4 text-xs font-bold uppercase tracking-[0.18em] text-black/55 sm:block">Training Center</span>
          </Link>
          <Link href={`/login?brand=${encodeURIComponent(brand.slug)}`} className="px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:opacity-85" style={{ backgroundColor: brand.primary_color }}>Sign in</Link>
        </div>
      </header>

      {publishedSections?.length ? <LandingPageSections sections={publishedSections} brand={brand} products={experience?.products ?? []}/> : <>

      <section className={`relative isolate overflow-hidden px-5 text-white lg:px-8 ${brand.hero_height === "compact" ? "py-16 lg:py-20" : brand.hero_height === "full" ? "flex min-h-[calc(100vh-92px)] items-center py-24" : "py-24 lg:py-32"}`} style={{ backgroundColor: brand.secondary_color }}>
        {brand.hero_image_url ? <><Image src={brand.hero_image_url} alt="" fill className="-z-20 object-cover" priority unoptimized/><div className="absolute inset-0 -z-10 bg-black" style={{opacity:(brand.hero_overlay??55)/100}}/></> : <><div className="absolute -right-32 -top-44 -z-10 h-[34rem] w-[34rem] rounded-full border-[90px] opacity-70" style={{ borderColor: brand.primary_color }} /><div className="absolute -bottom-40 -left-36 -z-10 h-96 w-96 rounded-full border-[72px] border-white/10" /></>}
        <div className={`mx-auto w-full max-w-7xl ${brand.hero_alignment === "center" ? "text-center" : ""}`}>
          <p className="text-sm font-extrabold uppercase italic tracking-[0.22em]" style={{ color: brand.primary_color }}>{brand.name} Learning Center</p>
          <h1 className={`mt-5 max-w-5xl text-5xl font-extrabold uppercase leading-[0.94] tracking-[-0.04em] sm:text-6xl lg:text-7xl ${brand.hero_alignment === "center" ? "mx-auto" : ""}`}>{brand.landing_headline || "Product knowledge that drives sales."}</h1>
          <p className={`mt-7 max-w-2xl text-lg leading-8 text-white/80 ${brand.hero_alignment === "center" ? "mx-auto" : ""}`}>{brand.landing_description || `Learn ${brand.name} products, complete assigned training, and build the confidence to serve every customer.`}</p>
          <div className={`mt-10 flex flex-col gap-4 sm:flex-row ${brand.hero_alignment === "center" ? "justify-center" : ""}`}>
            <Link href={`/login?brand=${encodeURIComponent(brand.slug)}`} className="inline-flex min-h-14 items-center justify-center px-7 font-extrabold uppercase tracking-wide text-white transition hover:brightness-90" style={{ backgroundColor: brand.primary_color }}>{brand.hero_cta_text || "Start training"}</Link>
            <a href="#benefits" className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 font-bold uppercase tracking-wide hover:bg-white hover:text-black">Explore the platform</a>
          </div>
        </div>
      </section>

      {brand.banner_image_url && <section className="mx-auto max-w-7xl px-5 pt-12 lg:px-8">{brand.banner_link_url ? <a href={brand.banner_link_url} target="_blank" rel="noreferrer"><Image src={brand.banner_image_url} alt={`${brand.name} featured banner`} width={1600} height={420} className="h-auto w-full object-cover" unoptimized/></a> : <Image src={brand.banner_image_url} alt={`${brand.name} featured banner`} width={1600} height={420} className="h-auto w-full object-cover" unoptimized/>}</section>}

      {settings.carousel?.enabled && <ProductCarousel products={experience?.products ?? []} manufacturerSlug={brand.slug} color={brand.primary_color} autoplay={settings.carousel.autoplay ?? true} />}

      <section id="benefits" className="px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-extrabold uppercase italic tracking-[0.22em]" style={{ color: brand.primary_color }}>Built for product experts</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Learn the products. Help customers choose with confidence.</h2>
          <div className={`mt-12 grid gap-5 ${settings.layout === "masonry" ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
            {[['Product Training', `Understand ${brand.name} products, applications, features, and customer benefits.`], ['Knowledge Checks', 'Complete focused quizzes that reinforce key product information.'], ['Progress Tracking', 'Keep training current and give managers visibility into team progress.']].map(([title, copy], index) => <article key={title} className={`border border-black/10 p-7 shadow-sm ${settings.layout === "masonry" ? index === 0 ? "md:col-span-2 lg:row-span-2 lg:p-10" : index === 2 ? "lg:col-span-2" : "" : ""}`}><div className="grid h-11 w-11 place-items-center text-sm font-extrabold text-white" style={{ backgroundColor: index === 0 ? brand.primary_color : brand.secondary_color }}>0{index + 1}</div><h3 className={`${settings.layout === "masonry" && index === 0 ? "mt-10 text-3xl sm:text-4xl" : "mt-6 text-xl"} font-extrabold uppercase`}>{title}</h3><p className="mt-3 leading-7 text-black/60">{copy}</p></article>)}
          </div>
        </div>
      </section>
      {brand.custom_html && <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><iframe title={`${brand.name} custom content`} sandbox="" srcDoc={brand.custom_html} className="min-h-[520px] w-full border-0 bg-white"/></section>}
      </>}
    </main>
  );
}
