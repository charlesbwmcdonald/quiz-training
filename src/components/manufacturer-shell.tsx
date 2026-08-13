import Image from "next/image";
import Link from "next/link";
import type { ManufacturerBrand } from "@/lib/branding";

export function ManufacturerHeader({ brand, email }: { brand: ManufacturerBrand; email?: string | null }) {
  const portal = `/m/${brand.slug}/app`;
  const landingPage = `/m/${brand.slug}`;
  const menuLink = "block min-w-48 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-black hover:bg-black/5";
  return <header className="border-b border-black/10 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
      <Link href={landingPage} prefetch={false} aria-label={`${brand.name} landing page`} className="flex min-w-0 items-center gap-4">
        {brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={170} height={40} className="max-h-10 w-auto object-contain" priority unoptimized /> : <span className="truncate text-xl font-black uppercase">{brand.name}</span>}
        <span className="hidden border-l border-black/15 pl-4 text-xs font-extrabold uppercase tracking-[0.16em] text-black/45 md:block">Training Center</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide sm:gap-4">
        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 marker:content-none hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">Learn <span aria-hidden="true" className="text-[10px] transition group-open:rotate-180">▼</span></summary>
          <div className="absolute right-0 z-50 mt-2 overflow-hidden border border-black/10 bg-white py-1 shadow-xl">
            <Link href={portal} prefetch={false} className={menuLink}>Training</Link>
            <Link href={`${portal}/team-training`} prefetch={false} className={menuLink}>Team Training</Link>
            <Link href={`${portal}/products`} prefetch={false} className={menuLink}>Products</Link>
            {brand.can_manage_training && <Link href={`${portal}/products/import`} prefetch={false} className={menuLink}>Import Products</Link>}
            {brand.can_manage_training && <Link href={`${portal}/courses`} prefetch={false} className={menuLink}>Courses</Link>}
          </div>
        </details>
        {(brand.can_manage_training || brand.can_view_reports || brand.can_manage_brand) && <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 marker:content-none hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">Manage <span aria-hidden="true" className="text-[10px] transition group-open:rotate-180">▼</span></summary>
          <div className="absolute right-0 z-50 mt-2 overflow-hidden border border-black/10 bg-white py-1 shadow-xl">
            {brand.can_manage_training && <Link href={`${portal}/retailers`} prefetch={false} className={menuLink}>Retailers</Link>}
            {brand.can_manage_training && <Link href={`${portal}/assignments`} prefetch={false} className={menuLink}>Assignments</Link>}
            {brand.can_view_reports && <Link href={`${portal}/reports`} prefetch={false} className={menuLink}>Reports</Link>}
            {brand.can_manage_brand && <Link href={`${portal}/users`} prefetch={false} className={menuLink}>Users</Link>}
            {brand.can_manage_brand && <Link href={`${portal}/settings/branding`} prefetch={false} className={menuLink} style={{ color: brand.primary_color }}>Brand</Link>}
          </div>
        </details>}
        {email && <span className="hidden max-w-48 truncate font-normal normal-case tracking-normal text-black/45 lg:block">{email}</span>}
        <Link href="/logout" className="px-2 text-black/55 hover:text-black">Sign out</Link>
      </nav>
    </div>
    <div className="h-1" style={{ backgroundColor: brand.primary_color }} />
  </header>;
}

export function BrandMark({ brand }: { brand: ManufacturerBrand }) {
  return <div className="flex items-center gap-3">{brand.logo_url ? <Image src={brand.logo_url} alt={`${brand.name} logo`} width={150} height={38} className="max-h-9 w-auto object-contain" unoptimized /> : <b className="uppercase">{brand.name}</b>}</div>;
}
