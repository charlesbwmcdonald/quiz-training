export default function Loading() {
  return <main className="min-h-screen bg-[#f4f1eb] text-[#101010]">
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <div className="h-7 w-40 animate-pulse bg-black/10" />
        <div className="h-11 w-28 animate-pulse bg-black/10" />
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24" aria-busy="true" aria-label="Loading page">
      <div className="h-4 w-44 animate-pulse bg-[#ff4f1f]/25" />
      <div className="mt-6 h-12 max-w-3xl animate-pulse bg-black/10 sm:h-16" />
      <div className="mt-4 h-12 max-w-2xl animate-pulse bg-black/10 sm:h-16" />
      <div className="mt-8 h-5 max-w-xl animate-pulse bg-black/10" />
      <div className="mt-3 h-5 max-w-lg animate-pulse bg-black/10" />
      <p className="mt-8 text-xs font-extrabold uppercase tracking-[.18em] text-black/40">Loading JobberTrain</p>
    </section>
  </main>;
}
