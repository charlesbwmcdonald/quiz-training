import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assignProgram, createProgram } from "./actions";
type Content = { quiz_id?: string; course_id?: string; title: string };
type Retailer = { company_id: string; company_name: string };
type Requirement = { type: string; id: string; title: string };
type Program = {
  id: string;
  name: string;
  description: string | null;
  minimum_certified_learners: number;
  validity_months: number | null;
  requirements: Requirement[];
};
type Assignment = {
  program_id: string;
  company_id: string;
  company_name: string;
  learner_count: number;
  certified_learners: number;
  minimum_required: number;
  is_certified: boolean;
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    assigned?: string;
  }>;
}) {
  const query = await searchParams,
    s = await createSupabaseServerClient();
  const [
    { data: a },
    brand,
    { data: qs },
    { data: cs },
    { data: rs },
    { data: d },
    { data: statusRows },
  ] = await Promise.all([
    s.auth.getUser(),
    getActiveBrand(),
    s.rpc("manufacturer_published_quizzes"),
    s.rpc("manufacturer_courses"),
    s.rpc("manufacturer_retailer_dashboard"),
    s.rpc("manufacturer_certification_dashboard"),
    s.rpc("manufacturer_certification_status"),
  ]);
  if (!a.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const programs = (d as { programs?: Program[] })?.programs ?? [],
    assignments = (statusRows ?? []) as Assignment[],
    retailers = (rs ?? []) as Retailer[],
    courses = ((cs ?? []) as (Content & { status: string })[]).filter(
      (x) => x.status === "published",
    );
  const input = "min-h-12 border border-black/20 bg-white px-4";
  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      <ManufacturerHeader brand={brand} email={a.user.email} />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <p
          className="text-sm font-extrabold uppercase italic tracking-[.2em]"
          style={{ color: brand.primary_color }}
        >
          Dealer development
        </p>
        <h1 className="mt-2 text-4xl font-extrabold uppercase sm:text-5xl">
          Certification Programs
        </h1>
        <p className="mt-3 max-w-3xl text-black/60">
          Turn required product training into measurable learner credentials and
          certified-dealer standards.
        </p>
        {query.error && (
          <p className="mt-6 bg-red-50 p-4 font-semibold text-red-900">
            {query.error}
          </p>
        )}
        {(query.created || query.assigned) && (
          <p className="mt-6 bg-green-50 p-4 font-semibold text-green-900">
            Certification program {query.created ? "created" : "assigned"}.
          </p>
        )}
        <div className="mt-10 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
          <form
            action={createProgram}
            className="border border-black/10 bg-white p-6 shadow-sm"
          >
            <p
              className="text-xs font-extrabold uppercase tracking-[.16em]"
              style={{ color: brand.primary_color }}
            >
              Create program
            </p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase">
              Certification standard
            </h2>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 font-bold">
                Program name
                <input name="name" required className={input} />
              </label>
              <label className="grid gap-2 font-bold">
                Description
                <textarea
                  name="description"
                  rows={3}
                  className="border border-black/20 p-4 font-normal"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 font-bold">
                  Certified employees required
                  <input
                    name="minimumLearners"
                    type="number"
                    min="1"
                    defaultValue="1"
                    className={input}
                  />
                </label>
                <label className="grid gap-2 font-bold">
                  Valid for months
                  <input
                    name="validityMonths"
                    type="number"
                    min="1"
                    placeholder="No expiration"
                    className={input}
                  />
                </label>
              </div>
              <fieldset className="border border-black/10 p-4">
                <legend className="px-2 text-sm font-extrabold uppercase">
                  Required training
                </legend>
                <div className="grid gap-2">
                  {((qs ?? []) as Content[]).map((x) => (
                    <label key={x.quiz_id} className="flex gap-3 p-2">
                      <input
                        name="requirements"
                        type="checkbox"
                        value={`quiz:${x.quiz_id}`}
                      />
                      <span>
                        <b>{x.title}</b>
                        <small className="ml-2 uppercase text-black/40">
                          Quiz
                        </small>
                      </span>
                    </label>
                  ))}
                  {courses.map((x) => (
                    <label key={x.course_id} className="flex gap-3 p-2">
                      <input
                        name="requirements"
                        type="checkbox"
                        value={`course:${x.course_id}`}
                      />
                      <span>
                        <b>{x.title}</b>
                        <small className="ml-2 uppercase text-black/40">
                          Course
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                className="min-h-12 font-extrabold uppercase text-white"
                style={{ backgroundColor: brand.primary_color }}
              >
                Create program
              </button>
            </div>
          </form>
          <section>
            <h2 className="text-2xl font-extrabold uppercase">
              Active programs
            </h2>
            <div className="mt-4 grid gap-5">
              {programs.map((p) => (
                <article
                  key={p.id}
                  className="border border-black/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <b className="text-xl uppercase">{p.name}</b>
                      <p className="mt-2 text-sm text-black/50">
                        {p.description || "Dealer certification program"}
                      </p>
                    </div>
                    <span className="h-fit bg-green-100 px-2 py-1 text-xs font-extrabold uppercase text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.requirements.map((r) => (
                      <span
                        key={`${r.type}-${r.id}`}
                        className="bg-black/5 px-3 py-2 text-xs font-bold uppercase"
                      >
                        {r.title} · {r.type}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm">
                    <b>{p.minimum_certified_learners}</b> certified employee
                    {p.minimum_certified_learners === 1 ? "" : "s"} required{" "}
                    {p.validity_months
                      ? `· Renews every ${p.validity_months} months`
                      : "· No expiration"}
                  </p>
                  <form
                    action={assignProgram}
                    className="mt-5 border-t border-black/10 pt-5"
                  >
                    <input type="hidden" name="programId" value={p.id} />
                    <b className="text-xs uppercase tracking-wide">
                      Assign to retailers
                    </b>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {retailers.map((r) => (
                        <label
                          key={r.company_id}
                          className="flex gap-2 text-sm"
                        >
                          <input
                            name="companyIds"
                            type="checkbox"
                            value={r.company_id}
                          />
                          {r.company_name}
                        </label>
                      ))}
                    </div>
                    <button className="mt-4 min-h-11 border-2 border-black px-5 text-xs font-extrabold uppercase">
                      Assign program
                    </button>
                  </form>
                  {assignments.filter((x) => x.program_id === p.id).length >
                    0 && (
                    <div className="mt-5 border-t border-black/10 pt-4">
                      <b className="text-xs uppercase text-black/40">
                        Assigned retailers
                      </b>
                      {assignments
                        .filter((x) => x.program_id === p.id)
                        .map((x) => (
                          <div key={x.company_id} className="mt-3 flex items-center justify-between gap-4 border-t border-black/5 pt-3 text-sm">
                            <span><b>{x.company_name}</b><small className="mt-1 block text-black/45">{x.certified_learners} of {x.minimum_required} required employees certified</small></span>
                            <span className={x.is_certified ? "bg-green-100 px-2 py-1 text-xs font-extrabold uppercase text-green-800" : "bg-amber-100 px-2 py-1 text-xs font-extrabold uppercase text-amber-900"}>{x.is_certified ? "Certified dealer" : "In progress"}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </article>
              ))}
              {!programs.length && (
                <div className="border border-dashed border-black/20 p-10 text-center text-black/50">
                  Create your first certification program.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
