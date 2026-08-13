import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicBrand } from "@/lib/branding";
import { login } from "./actions";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ brand?: string; next?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const brand = await getPublicBrand(params.brand);
  const platformLogin = params.next?.startsWith("/platform");
  return {
    title: brand ? `Sign in | ${brand.name} Training Center` : platformLogin ? "Sign in | JobberTrain" : "Sign in | Training Portal",
  };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; brand?: string }> }) {
  const params = await searchParams;
  const next = params?.next ?? "/app";
  const platformLogin = next.startsWith("/platform");
  const brand = await getPublicBrand(params.brand);
  const primary = brand?.primary_color ?? "#D90000";
  const secondary = brand?.secondary_color ?? "#000000";
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between" style={{ backgroundColor: secondary }}>
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[72px] opacity-80" style={{ borderColor: primary }} />
        <Link href={brand ? `/m/${brand.slug}` : "/"} className="relative z-10 w-fit">{brand?.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={210} height={48} className="max-h-12 w-auto object-contain brightness-0 invert" priority unoptimized /> : platformLogin ? <span className="text-2xl font-black uppercase tracking-[-0.05em]">Jobber<span style={{ color: primary }}>Train</span></span> : <span className="text-xl font-extrabold uppercase tracking-wide">Training Portal</span>}</Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: primary }}>{brand?.name ?? "Dealer"} learning center</p>
          <h1 className="mt-4 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight">{brand?.landing_headline ?? <>Know the product.<br /><span className="italic" style={{ color: primary }}>Sell with confidence.</span></>}</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">{brand?.landing_description ?? "Access product training, complete assigned quizzes, and keep your product knowledge current."}</p>
        </div>
        <p className="relative z-10 text-sm text-white/40">{brand?.name ?? (platformLogin ? "JobberTrain Platform" : "Private Training Portal")}</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link href={brand ? `/m/${brand.slug}` : "/"} className="mb-12 block w-fit text-2xl font-black uppercase tracking-[-0.05em] lg:hidden">{brand?.name ?? (platformLogin ? <>Jobber<span style={{ color: primary }}>Train</span></> : "Training Portal")}</Link>
          <p className="text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: primary }}>Welcome back</p>
          <h2 className="mt-2 text-4xl font-extrabold uppercase tracking-tight">Sign in</h2>
          <p className="mt-3 text-black/60">Enter your account details to continue to training.</p>
          {params?.error && <div role="alert" className="mt-6 border-l-4 border-[#d90000] bg-red-50 p-4 text-sm text-red-900"><b>We couldn’t sign you in.</b><br />{params.error}</div>}
          <form action={login} className="mt-8 grid gap-5">
            <input type="hidden" name="next" value={next} />
            {brand && <input type="hidden" name="brand" value={brand.slug} />}
            <label className="grid gap-2 font-bold">Email address<input name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="min-h-13 border border-black/20 px-4 font-normal outline-none focus:border-[#d90000]" /></label>
            <label className="grid gap-2 font-bold">Password<input name="password" type="password" required autoComplete="current-password" className="min-h-13 border border-black/20 px-4 font-normal outline-none focus:border-[#d90000]" /></label>
            <button type="submit" className="mt-2 min-h-13 px-6 font-extrabold uppercase tracking-wide text-white transition hover:brightness-90" style={{ backgroundColor: primary }}>Sign in to training</button>
          </form>
          <Link href={brand ? `/m/${brand.slug}` : "/"} className="mt-8 inline-block text-sm font-bold text-black/55 hover:underline">← Return to home page</Link>
        </div>
      </section>
    </main>
  );
}
