import Image from "next/image";
import Link from "next/link";
import { switchAcademy } from "@/app/academies/actions";
import { getAcademyDirectory } from "@/lib/academies";
import type { ManufacturerBrand } from "@/lib/branding";
import {AcademyMobileMenu} from "@/components/academy-mobile-menu";
import {AcademyDesktopMenu} from "@/components/academy-desktop-menu";

type PublicBrandHeader = Pick<ManufacturerBrand, "name" | "slug" | "logo_url" | "primary_color">;

export function PublicManufacturerHeader({ brand, showAcademyHome = false }: { brand: PublicBrandHeader; showAcademyHome?: boolean }) {
  return <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
      <Link href={`/m/${brand.slug}`} className="flex min-w-0 items-center gap-4" aria-label={`${brand.name} training center home`}>
        {brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={190} height={52} className="max-h-11 w-auto object-contain" priority unoptimized /> : <span className="truncate text-xl font-extrabold uppercase">{brand.name}</span>}
        <span className="hidden border-l border-black/20 pl-4 text-xs font-bold uppercase tracking-[0.18em] text-black/55 sm:block">Training Center</span>
      </Link>
      <nav aria-label="Academy navigation" className="flex shrink-0 items-center gap-2 sm:gap-3">
        {showAcademyHome && <Link href={`/m/${brand.slug}`} className="hidden px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-black/55 hover:text-black sm:inline-flex">Academy home</Link>}
        <Link href={`/login?brand=${encodeURIComponent(brand.slug)}`} className="inline-flex min-h-11 items-center px-4 text-xs font-extrabold uppercase tracking-wide text-white transition hover:brightness-90 sm:px-5" style={{ backgroundColor: brand.primary_color }}>Sign in</Link>
      </nav>
    </div>
    <div className="h-1" style={{ backgroundColor: brand.primary_color }} />
  </header>;
}

export async function ManufacturerHeader({ brand, email }: { brand: ManufacturerBrand; email?: string | null }) {
  const portal = `/m/${brand.slug}/app`;
  const academyHome = brand.can_manage_training ? portal : `${portal}/my-training`;
  const {academies}=await getAcademyDirectory();
  return <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 shadow-[0_1px_0_rgba(16,16,16,.04)] backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-5 sm:px-5 sm:py-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3"><Link href={academyHome} prefetch={false} aria-label={`${brand.name} academy dashboard`} className="flex min-w-0 items-center gap-4">
        {brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={170} height={40} className="max-h-9 w-auto max-w-[108px] object-contain sm:max-h-10 sm:max-w-[170px]" priority unoptimized /> : <span className="max-w-[108px] truncate text-base font-black uppercase sm:max-w-none sm:text-xl">{brand.name}</span>}
      </Link><details className="group relative hidden lg:block"><summary className="flex cursor-pointer list-none items-center gap-2 border-l border-black/15 py-1 pl-4 text-left marker:content-none [&::-webkit-details-marker]:hidden"><span><b className="block text-xs uppercase tracking-[.14em] text-black/55">{brand.name} Academy</b><span className="block text-[9px] font-bold uppercase tracking-[.12em] text-black/35">Powered by JobberTrain</span></span><span aria-hidden="true" className="text-[9px] transition group-open:rotate-180">▼</span></summary><div className="absolute left-0 z-50 mt-3 w-80 overflow-hidden rounded-lg border border-black/10 bg-white p-1 shadow-[0_16px_40px_rgba(16,16,16,.14)]"><p className="px-3 pb-2 pt-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-black/35">Switch Academy</p>{academies.map(academy=>academy.id===brand.id?<div key={academy.id} className="flex items-center justify-between rounded-md bg-black/[.04] px-3 py-3 text-xs font-extrabold uppercase"><span>{academy.name} Academy</span><span style={{color:brand.primary_color}}>Current</span></div>:<form key={academy.id} action={switchAcademy}><input type="hidden" name="academyId" value={academy.id}/><button className="block w-full rounded-md px-3 py-3 text-left text-xs font-extrabold uppercase hover:bg-black/5">{academy.name} Academy</button></form>)}<Link href="/academies" className="mt-1 block border-t border-black/10 px-3 pb-2 pt-3 text-xs font-extrabold uppercase hover:underline">My Academies & Invitations →</Link></div></details></div>
      <nav aria-label="Main navigation" className="hidden shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide lg:flex xl:gap-2">
        <AcademyDesktopMenu portal={portal} primary={brand.primary_color} canManageTraining={Boolean(brand.can_manage_training)} canViewReports={Boolean(brand.can_view_reports)} canManageBrand={Boolean(brand.can_manage_brand)} />
        {email && <span className="hidden max-w-48 truncate font-normal normal-case tracking-normal text-black/45 xl:block">{email}</span>}
        <form action={`/logout?brand=${encodeURIComponent(brand.slug)}`} method="post">
          <button type="submit" className="min-h-10 rounded-md px-3 text-black/55 hover:bg-black/5 hover:text-black">Sign out</button>
        </form>
      </nav>
      <AcademyMobileMenu slug={brand.slug} primary={brand.primary_color} canManageTraining={Boolean(brand.can_manage_training)} canViewReports={Boolean(brand.can_view_reports)} canManageBrand={Boolean(brand.can_manage_brand)}/>
    </div>
    <div className="h-1" style={{ backgroundColor: brand.primary_color }} />
  </header>;
}

export function BrandMark({ brand }: { brand: ManufacturerBrand }) {
  return <div className="flex items-center gap-3">{brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={150} height={38} className="max-h-9 w-auto object-contain" unoptimized /> : <b className="uppercase">{brand.name}</b>}</div>;
}
