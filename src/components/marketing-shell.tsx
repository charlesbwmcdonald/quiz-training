import Link from "next/link";
import {JobberTrainLogo} from "@/components/jobbertrain-logo";
import {MarketingMobileMenu} from "@/components/marketing-mobile-menu";

export function MarketingHeader() {
  return <><header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f4f1eb]/95 backdrop-blur">
    <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
      <Link href="/" aria-label="JobberTrain home" className="shrink-0"><JobberTrainLogo className="h-8 w-auto sm:h-9" priority/></Link>
      <nav className="hidden items-center gap-7 md:flex" aria-label="Public navigation">
        <Link href="/#how-it-works" className="text-xs font-extrabold uppercase tracking-[.12em] hover:text-[#ff4f1f]">How it works</Link>
        <Link href="/#features" className="text-xs font-extrabold uppercase tracking-[.12em] hover:text-[#ff4f1f]">Features</Link>
        <Link href="/pricing" className="text-xs font-extrabold uppercase tracking-[.12em] hover:text-[#ff4f1f]">Pricing</Link>
        <Link href="/contact" className="text-xs font-extrabold uppercase tracking-[.12em] hover:text-[#ff4f1f]">Contact</Link>
      </nav>
      <div className="hidden items-center gap-3 md:flex"><Link href="/login?next=/platform" className="px-3 py-3 text-xs font-extrabold uppercase tracking-wide">Sign in</Link><Link href="/contact" className="bg-black px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-[#ff4f1f]">Discuss a pilot</Link></div>
      <MarketingMobileMenu/>
    </div>
  </header><div aria-hidden="true" className="h-[76px]"/></>;
}

export function MarketingFooter() {
  return <footer className="bg-[#101010] px-5 py-10 text-white lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 lg:flex-row lg:items-center"><div><Link href="/" aria-label="JobberTrain home" className="block w-fit"><JobberTrainLogo className="h-8 w-auto"/></Link><p className="mt-2 text-sm text-white/40">Manufacturer product knowledge for the last mile of the sale.</p></div><div className="flex flex-wrap gap-5 text-xs font-extrabold uppercase tracking-wide text-white/55"><Link href="/pricing" className="hover:text-white">Pricing</Link><Link href="/contact" className="hover:text-white">Contact</Link><Link href="/m/gen-y-hitch" className="hover:text-white">Live academy</Link><Link href="/login?next=/platform" className="hover:text-white">Sign in</Link></div><span className="text-xs text-white/35">© {new Date().getFullYear()} JobberTrain</span></div></footer>;
}
