"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Announcement = { text: string; url?: string };
export type FeaturedProduct = { id: string; name: string; slug: string; tagline: string | null; image: string | null };

export function AnnouncementBar({ announcements, color }: { announcements: Announcement[]; color: string }) {
  const [index, setIndex] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => setMotionAllowed(!window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    if (!motionAllowed || announcements.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % announcements.length), 5000);
    return () => window.clearInterval(timer);
  }, [announcements.length, motionAllowed]);
  if (!announcements.length) return null;
  const item = announcements[index] ?? announcements[0];
  return <div className="min-h-11 px-5 py-3 text-center text-sm font-bold text-white" style={{ backgroundColor: color }} aria-live="polite">{item.url ? <a href={item.url} className="underline decoration-white/50 underline-offset-4">{item.text} ↗</a> : item.text}{announcements.length > 1 && <span className="ml-3 text-xs text-white/60">{index + 1}/{announcements.length}</span>}</div>;
}

export function ProductCarousel({ products, manufacturerSlug, color, autoplay, title = "Featured products" }: { products: FeaturedProduct[]; manufacturerSlug: string; color: string; autoplay: boolean; title?: string }) {
  const [index, setIndex] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => setMotionAllowed(!window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    if (!autoplay || !motionAllowed || products.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % products.length), 6500);
    return () => window.clearInterval(timer);
  }, [autoplay, motionAllowed, products.length]);
  if (!products.length) return null;
  const product = products[index] ?? products[0];
  const move = (direction: number) => setIndex((current) => (current + direction + products.length) % products.length);
  return <section className="bg-[#f4f4f2] px-5 py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-5"><div><p className="text-sm font-extrabold uppercase italic tracking-[.2em]" style={{ color }}>Product library</p><h2 className="mt-3 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">{title}</h2></div>{products.length > 1 && <div className="flex gap-2"><button type="button" onClick={() => move(-1)} aria-label="Previous featured product" className="grid h-12 w-12 place-items-center border-2 border-black text-xl font-black transition hover:bg-black hover:text-white">←</button><button type="button" onClick={() => move(1)} aria-label="Next featured product" className="grid h-12 w-12 place-items-center border-2 border-black text-xl font-black transition hover:bg-black hover:text-white">→</button></div>}</div><article className="mt-9 grid overflow-hidden bg-white shadow-sm lg:grid-cols-2"><div className="min-h-72 bg-black/5">{product.image ? <img src={product.image} alt="" className="h-full min-h-72 w-full object-cover" /> : <div className="grid h-full min-h-72 place-items-center text-sm font-extrabold uppercase text-black/30">Product image</div>}</div><div className="flex flex-col justify-center p-8 sm:p-12"><span className="text-xs font-extrabold uppercase tracking-[.18em]" style={{ color }}>Featured · {index + 1} of {products.length}</span><h3 className="mt-4 text-3xl font-extrabold uppercase sm:text-4xl">{product.name}</h3><p className="mt-5 max-w-xl text-lg leading-8 text-black/55">{product.tagline || "Explore product features, specifications, applications, and selling points."}</p><Link href={`/m/${manufacturerSlug}/products/${product.slug}`} className="mt-8 inline-flex min-h-13 w-fit items-center px-6 font-extrabold uppercase text-white" style={{ backgroundColor: color }}>Explore product →</Link></div></article><div className="mt-5 flex justify-center gap-2">{products.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} aria-label={`Show ${item.name}`} className="h-2.5 transition-all" style={{ width: itemIndex === index ? 32 : 10, backgroundColor: itemIndex === index ? color : "#C5C5C5" }} />)}</div></div></section>;
}
