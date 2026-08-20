import Link from "next/link";
import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type Cert = {
  id: string;
  title: string;
  content_type: string;
  issued_at: string;
};
export default async function Page() {
  const s = await createSupabaseServerClient();
  const [{ data: a }, brand, { data }] = await Promise.all([
    s.auth.getUser(),
    getActiveBrand(),
    s.rpc("sync_my_certificates"),
  ]);
  if (!a.user) redirect("/login");
  if (!brand) redirect("/app");
  const rows = (data ?? []) as Cert[];
  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      <ManufacturerHeader brand={brand} email={a.user.email} />
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <p
          className="text-sm font-extrabold uppercase italic tracking-[.2em]"
          style={{ color: brand.primary_color }}
        >
          {brand.name} achievements
        </p>
        <h1 className="mt-2 text-5xl font-extrabold uppercase">Certificates</h1>
        <p className="mt-3 text-black/55">
          Download credentials earned from completed training.
        </p>
        <section className="mt-8 overflow-hidden border border-black/10 bg-white">
          {rows.map((c) => (
            <article
              key={c.id}
              className="grid gap-4 border-b border-black/10 p-5 last:border-0 sm:grid-cols-[1fr_120px_150px] sm:items-center"
            >
              <div>
                <b className="uppercase">{c.title}</b>
                <p className="mt-1 text-sm text-black/45">
                  Certificate {c.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <span className="text-xs font-extrabold uppercase">
                {c.content_type}
              </span>
              <Link
                href={`/m/${brand.slug}/app/certificates/${c.id}`}
                className="flex min-h-11 items-center justify-center px-4 text-xs font-extrabold uppercase text-white"
                style={{ backgroundColor: brand.primary_color }}
              >
                View & download
              </Link>
            </article>
          ))}
          {!rows.length && (
            <div className="p-12 text-center">
              <h2 className="text-xl font-extrabold uppercase">
                No certificates yet
              </h2>
              <p className="mt-2 text-black/50">
                Complete assigned training to earn your first certificate.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
