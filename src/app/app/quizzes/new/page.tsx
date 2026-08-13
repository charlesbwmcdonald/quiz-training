import Link from "next/link";
import { redirect } from "next/navigation";
import QuizBuilder from "./quiz-builder";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ManufacturerHeader } from "@/components/manufacturer-shell";

export default async function NewQuizPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [brand, supabase] = await Promise.all([getActiveBrand(), createSupabaseServerClient()]);
  if (!brand) redirect("/app");
  const { data: auth } = await supabase.auth.getUser();
  return <div className="min-h-screen bg-[#f4f4f2] text-black" style={{ "--brand-primary": brand.primary_color } as React.CSSProperties}><ManufacturerHeader brand={brand} email={auth.user?.email} /><main className="px-5 py-10 lg:px-8"><div className="mx-auto max-w-4xl"><Link href="/app" className="text-sm font-bold uppercase tracking-wide text-black/60 hover:underline">← Quiz library</Link><p className="mt-8 text-sm font-extrabold uppercase italic tracking-[0.2em]" style={{ color: brand.primary_color }}>{brand.name} quiz builder</p><h1 className="mt-2 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Create a quiz</h1><p className="mt-3 text-black/60">Add questions and identify one correct answer for each. You can save a draft or publish immediately.</p><QuizBuilder error={error} primaryColor={brand.primary_color} /></div></main></div>;
}
