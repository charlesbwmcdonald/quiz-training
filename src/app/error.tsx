"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#f4f1eb] px-5 py-16 text-[#101010]">
    <section className="w-full max-w-2xl border border-black/10 bg-white p-7 shadow-sm sm:p-10">
      <p className="text-sm font-extrabold uppercase tracking-[.2em] text-[#d93a10]">Something interrupted the page</p>
      <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">Let&apos;s get you moving again.</h1>
      <p className="mt-5 max-w-xl leading-7 text-black/55">Your account and progress are safe. Try the page again, or return to JobberTrain and choose where you want to go.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={reset} className="min-h-12 bg-black px-6 font-extrabold uppercase text-white">Try again</button>
        <Link href="/academies" className="inline-flex min-h-12 items-center border-2 border-black px-6 font-extrabold uppercase">My academies</Link>
        <Link href="/" className="inline-flex min-h-12 items-center px-4 font-extrabold uppercase text-black/55">JobberTrain home</Link>
      </div>
    </section>
  </main>;
}
