export default function AcademyLoading() {
  return <main className="min-h-screen bg-[#f4f4f2] text-black">
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-5 lg:px-8">
        <div className="h-9 w-28 animate-pulse bg-black/10 sm:w-44" />
        <div className="flex gap-3"><div className="h-10 w-14 animate-pulse bg-black/10" /><div className="h-10 w-16 animate-pulse bg-black/10" /></div>
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14" aria-busy="true" aria-label="Loading academy">
      <div className="h-4 w-40 animate-pulse bg-black/10" />
      <div className="mt-4 h-12 max-w-lg animate-pulse bg-black/10" />
      <div className="mt-4 h-5 max-w-2xl animate-pulse bg-black/10" />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map(item => <div key={item} className="h-32 animate-pulse border border-black/10 bg-white" />)}</div>
      <div className="mt-8 h-64 animate-pulse border border-black/10 bg-white" />
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-black/35">Loading academy</p>
    </section>
  </main>;
}
