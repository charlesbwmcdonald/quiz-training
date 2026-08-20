import Image from "next/image";
import Link from "next/link";
import { switchAcademy } from "@/app/academies/actions";
import { getAcademyDirectory } from "@/lib/academies";
import type { ManufacturerBrand } from "@/lib/branding";

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
  const menuLink = "block min-w-48 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-black hover:bg-black/5";
  const {academies}=await getAcademyDirectory();
  return <header className="border-b border-black/10 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3"><Link href={academyHome} prefetch={false} aria-label={`${brand.name} academy dashboard`} className="flex min-w-0 items-center gap-4">
        {brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={170} height={40} className="max-h-10 w-auto object-contain" priority unoptimized /> : <span className="truncate text-xl font-black uppercase">{brand.name}</span>}
      </Link><details className="group relative hidden md:block"><summary className="flex cursor-pointer list-none items-center gap-2 border-l border-black/15 py-1 pl-4 text-left marker:content-none [&::-webkit-details-marker]:hidden"><span><b className="block text-xs uppercase tracking-[.14em] text-black/55">{brand.name} Academy</b><span className="block text-[9px] font-bold uppercase tracking-[.12em] text-black/35">Powered by JobberTrain</span></span><span aria-hidden="true" className="text-[9px] transition group-open:rotate-180">▼</span></summary><div className="absolute left-0 z-50 mt-3 w-72 overflow-hidden border border-black/10 bg-white py-2 shadow-xl"><p className="px-4 pb-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-black/35">Switch Academy</p>{academies.map(academy=>academy.id===brand.id?<div key={academy.id} className="flex items-center justify-between bg-black/[.04] px-4 py-3 text-xs font-extrabold uppercase"><span>{academy.name} Academy</span><span style={{color:brand.primary_color}}>Current</span></div>:<form key={academy.id} action={switchAcademy}><input type="hidden" name="academyId" value={academy.id}/><button className="block w-full px-4 py-3 text-left text-xs font-extrabold uppercase hover:bg-black/5">{academy.name} Academy</button></form>)}<Link href="/academies" className="mt-1 block border-t border-black/10 px-4 pt-3 text-xs font-extrabold uppercase hover:underline">My Academies & Invitations →</Link></div></details></div>
      <nav aria-label="Main navigation" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide sm:gap-4">
        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 marker:content-none hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">Learn <span aria-hidden="true" className="text-[10px] transition group-open:rotate-180">▼</span></summary>
          <div className="absolute right-0 z-50 mt-2 overflow-hidden border border-black/10 bg-white py-1 shadow-xl">
            {brand.can_manage_training && <Link href={portal} prefetch={false} className={menuLink}>Quizzes</Link>}
            {brand.can_manage_training && <Link href={`${portal}/courses`} prefetch={false} className={menuLink}>Courses</Link>}
            {brand.can_manage_training && <Link href={`${portal}/products`} prefetch={false} className={menuLink}>Products</Link>}
            <div className={brand.can_manage_training ? "mt-1 border-t border-black/10 pt-1" : ""}><Link href={`${portal}/my-training`} prefetch={false} className={menuLink} style={{ color: brand.primary_color }}>My Training</Link><Link href="/academies" prefetch={false} className={menuLink} style={{ color: brand.primary_color }}>My Academies</Link></div>
          </div>
        </details>
        {(brand.can_manage_training || brand.can_view_reports || brand.can_manage_brand) && <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 marker:content-none hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">Manage <span aria-hidden="true" className="text-[10px] transition group-open:rotate-180">▼</span></summary>
          <div className="absolute right-0 z-50 mt-2 overflow-hidden border border-black/10 bg-white py-1 shadow-xl">
            {brand.can_manage_training && <Link href={`${portal}/retailers`} prefetch={false} className={menuLink}>Retailers</Link>}
            {brand.can_manage_training && <Link href={`${portal}/assignments`} prefetch={false} className={menuLink}>Assignments</Link>}
            {brand.can_view_reports && <Link href={`${portal}/reports`} prefetch={false} className={menuLink}>Reports</Link>}
            {brand.can_manage_brand && <Link href={`${portal}/users`} prefetch={false} className={menuLink}>Users</Link>}
            {brand.can_manage_brand && <div className="mt-1 border-t border-black/10 pt-1"><Link href={`${portal}/settings/branding`} prefetch={false} className={menuLink} style={{ color: brand.primary_color }}>Brand</Link></div>}
          </div>
        </details>}
        <Link href="/academies" className="px-2 text-xs font-extrabold uppercase text-black/55 hover:text-black md:hidden">Academies</Link>
        {email && <span className="hidden max-w-48 truncate font-normal normal-case tracking-normal text-black/45 xl:block">{email}</span>}
        <form action={`/logout?brand=${encodeURIComponent(brand.slug)}`} method="post">
          <button type="submit" className="px-2 text-black/55 hover:text-black">Sign out</button>
        </form>
      </nav>
    </div>
    <div className="h-1" style={{ backgroundColor: brand.primary_color }} />
  </header>;
}

export function BrandMark({ brand }: { brand: ManufacturerBrand }) {
  return <div className="flex items-center gap-3">{brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={150} height={38} className="max-h-9 w-auto object-contain" unoptimized /> : <b className="uppercase">{brand.name}</b>}</div>;
}
