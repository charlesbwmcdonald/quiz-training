import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export default async function Page({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { id } = { id: (await params).certificateId };
  const s = await createSupabaseServerClient();
  const [{ data: a }, brand, { data: c }] = await Promise.all([
    s.auth.getUser(),
    getActiveBrand(),
    s
      .from("certificates")
      .select("id,title,content_type,issued_at")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (!a.user) redirect("/login");
  if (!brand) redirect("/app");
  if (!c) notFound();
  return (
    <div className="min-h-screen bg-[#eee]">
      <ManufacturerHeader brand={brand} email={a.user.email} />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-5 flex justify-between">
          <Link href={`/m/${brand.slug}/app/certificates`} className="text-sm font-bold uppercase">
            ← Certificates
          </Link>
          <a
            href={`/m/${brand.slug}/app/certificates/${id}/download`}
            className="px-5 py-3 text-sm font-extrabold uppercase text-white"
            style={{ backgroundColor: brand.primary_color }}
          >
            Download PDF
          </a>
        </div>
        <section
          className="aspect-[1.414/1] border-[12px] bg-white p-12 shadow-xl"
          style={{ borderColor: brand.secondary_color }}
        >
          <div
            className="flex h-full flex-col items-center justify-center border-2 text-center"
            style={{ borderColor: brand.primary_color }}
          >
            <p
              className="text-sm font-black uppercase tracking-[.35em]"
              style={{ color: brand.primary_color }}
            >
              {brand.name} Academy
            </p>
            <h1 className="mt-8 text-5xl font-black uppercase">
              Certificate of Completion
            </h1>
            <p className="mt-8 text-lg text-black/50">This certifies that</p>
            <h2 className="mt-3 text-3xl font-bold">{a.user.email}</h2>
            <p className="mt-8 text-lg text-black/50">successfully completed</p>
            <h3 className="mt-3 text-3xl font-black uppercase">{c.title}</h3>
            <p className="mt-8 text-sm">
              Issued{" "}
              {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
                new Date(c.issued_at),
              )}
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[.18em] text-black/40">
              Certificate {c.id.toUpperCase()}
            </p>
            <p className="mt-8 text-xs font-extrabold uppercase text-black/35">
              Powered by JobberTrain
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
