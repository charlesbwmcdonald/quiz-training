import { redirect } from "next/navigation";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveSettings, sendTest } from "./actions";
type Settings = {
  assignment_enabled: boolean;
  due_soon_enabled: boolean;
  due_soon_days: number;
  overdue_enabled: boolean;
  overdue_repeat_days: number;
  certificate_enabled: boolean;
  certified_dealer_enabled: boolean;
  weekly_summary_enabled: boolean;
  summary_email: string | null;
};
type Delivery = {
  id: number;
  notification_type: string;
  recipient: string;
  subject: string;
  status: string;
  created_at: string;
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tested?: string; error?: string }>;
}) {
  const query = await searchParams,
    s = await createSupabaseServerClient();
  const [{ data: a }, brand, { data }] = await Promise.all([
    s.auth.getUser(),
    getActiveBrand(),
    s.rpc("notification_center_dashboard"),
  ]);
  if (!a.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const d = data as { settings: Settings; deliveries: Delivery[] },
    x = d.settings,
    input = "min-h-11 border border-black/20 px-3";
  const toggle = (
    name: string,
    title: string,
    copy: string,
    checked: boolean,
    timing?: { name: string; value: number; label: string },
  ) => (
    <div className="grid min-h-24 gap-4 border-b border-black/10 py-5 sm:grid-cols-[minmax(240px,1fr)_180px_90px] sm:items-center sm:gap-6">
      <div>
        <b className="block uppercase">{title}</b>
        <small className="mt-1 block text-black/45">{copy}</small>
      </div>
      <div>
        {timing ? (
          <label className="flex items-center gap-3">
            <input
              name={timing.name}
              type="number"
              min="1"
              defaultValue={timing.value}
              aria-label={`${title} day count`}
              className={`${input} w-20 text-center font-bold`}
            />
            <span className="text-xs font-extrabold uppercase text-black/50">
              Days {timing.label}
            </span>
          </label>
        ) : (
          <span className="hidden text-black/20 sm:block">-</span>
        )}
      </div>
      <label className="flex items-center gap-3 sm:justify-center">
        <input
          name={name}
          type="checkbox"
          defaultChecked={checked}
          className="h-6 w-6"
        />
        <span className="text-xs font-extrabold uppercase text-black/45 sm:hidden">
          Enabled
        </span>
      </label>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      <ManufacturerHeader brand={brand} email={a.user.email} />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <p
          className="text-sm font-extrabold uppercase italic tracking-[.2em]"
          style={{ color: brand.primary_color }}
        >
          Academy communication
        </p>
        <h1 className="mt-2 text-4xl font-extrabold uppercase sm:text-5xl">
          Notifications
        </h1>
        <p className="mt-3 max-w-3xl text-black/60">
          Control automated learner reminders, achievement messages, and manager
          reporting.
        </p>
        {query.error && (
          <p className="mt-6 bg-red-50 p-4 text-red-900">{query.error}</p>
        )}
        {query.saved && (
          <p className="mt-6 bg-green-50 p-4 font-semibold text-green-900">
            Notification settings saved.
          </p>
        )}
        {query.tested && (
          <p className="mt-6 bg-green-50 p-4 font-semibold text-green-900">
            Test email {query.tested}.
          </p>
        )}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="border border-black/10 bg-white p-5 shadow-sm">
            <span className="text-xs font-extrabold uppercase text-black/45">
              Enabled rules
            </span>
            <b className="mt-2 block text-4xl">
              {
                [
                  x.assignment_enabled,
                  x.due_soon_enabled,
                  x.overdue_enabled,
                  x.certificate_enabled,
                  x.certified_dealer_enabled,
                  x.weekly_summary_enabled,
                ].filter(Boolean).length
              }
            </b>
            <p className="mt-1 text-sm text-black/45">of 6 available</p>
          </article>
          <article className="border border-black/10 bg-white p-5 shadow-sm">
            <span className="text-xs font-extrabold uppercase text-black/45">
              Recent deliveries
            </span>
            <b className="mt-2 block text-4xl">{d.deliveries.length}</b>
            <p className="mt-1 text-sm text-black/45">Latest 25 retained</p>
          </article>
          <article
            className="p-5 text-white shadow-sm"
            style={{ backgroundColor: brand.secondary_color }}
          >
            <span className="text-xs font-extrabold uppercase text-white/60">
              Delivery mode
            </span>
            <b className="mt-2 block text-2xl uppercase">Opt in</b>
            <p className="mt-2 text-sm text-white/60">
              Nothing sends until enabled
            </p>
          </article>
        </section>
        <div className="mt-8 space-y-6">
          <form
            action={saveSettings}
            className="border border-black/10 bg-white p-6 shadow-sm lg:p-8"
          >
            <h2 className="text-2xl font-extrabold uppercase">
              Delivery rules
            </h2>
            <div className="mt-5 hidden grid-cols-[minmax(240px,1fr)_180px_90px] gap-6 border-y border-black/10 bg-black/[.03] px-0 py-3 text-xs font-extrabold uppercase tracking-wide text-black/45 sm:grid">
              <span>Notification</span>
              <span>Timing</span>
              <span className="text-center">Enabled</span>
            </div>
            {toggle(
              "assignment",
              "New assignments",
              "Send when training is assigned.",
              x.assignment_enabled,
            )}
            {toggle(
              "dueSoon",
              "Due soon",
              "Remind learners before training is due.",
              x.due_soon_enabled,
              { name: "dueDays", value: x.due_soon_days, label: "before" },
            )}
            {toggle(
              "overdue",
              "Overdue training",
              "Continue reminders after a due date passes.",
              x.overdue_enabled,
              {
                name: "overdueDays",
                value: x.overdue_repeat_days,
                label: "after",
              },
            )}
            {toggle(
              "certificate",
              "Certificate earned",
              "Celebrate learner credentials.",
              x.certificate_enabled,
            )}
            {toggle(
              "dealer",
              "Certified Dealer reached",
              "Notify the management team when a location qualifies.",
              x.certified_dealer_enabled,
            )}
            {toggle(
              "summary",
              "Weekly manager summary",
              "Send academy performance highlights each week.",
              x.weekly_summary_enabled,
            )}
            <label className="mt-5 grid gap-2 font-bold">
              Manager summary email
              <input
                name="summaryEmail"
                type="email"
                defaultValue={x.summary_email ?? ""}
                className={input}
              />
            </label>
            <button
              className="mt-6 min-h-12 px-6 font-extrabold uppercase text-white"
              style={{ backgroundColor: brand.primary_color }}
            >
              Save notification settings
            </button>
          </form>
          <div className="space-y-6">
            <form
              action={sendTest}
              className="grid gap-4 border border-black/10 bg-white p-6 shadow-sm sm:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)_180px] sm:items-end"
            >
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-[.16em]"
                  style={{ color: brand.primary_color }}
                >
                  Delivery check
                </p>
                <h2 className="mt-2 text-xl font-extrabold uppercase">
                  Send test email
                </h2>
                <p className="mt-1 text-sm text-black/50">
                  Verify academy branding and delivery.
                </p>
              </div>
              <label className="grid gap-2 text-xs font-extrabold uppercase text-black/45">
                Recipient
                <input
                  name="testEmail"
                  type="email"
                  required
                  placeholder="email@example.com"
                  className={`${input} w-full text-sm font-normal normal-case text-black`}
                />
              </label>
              <button className="min-h-11 w-full border-2 border-black font-extrabold uppercase">
                Send test email
              </button>
            </form>
            <section className="overflow-x-auto border border-black/10 bg-white shadow-sm">
              <div className="border-b border-black/10 p-5">
                <h2 className="text-xl font-extrabold uppercase">
                  Recent activity
                </h2>
              </div>
              <div className="hidden min-w-[900px] grid-cols-[120px_minmax(180px,1fr)_minmax(240px,1.4fr)_100px_150px] gap-5 border-b border-black/10 bg-black/[.03] px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-black/45 lg:grid">
                <span>Type</span>
                <span>Recipient</span>
                <span>Subject</span>
                <span>Status</span>
                <span>Sent</span>
              </div>
              {d.deliveries.map((v) => (
                <div
                  key={v.id}
                  className="grid min-h-20 min-w-[900px] grid-cols-[120px_minmax(180px,1fr)_minmax(240px,1.4fr)_100px_150px] items-center gap-5 border-b border-black/10 px-5 py-4 last:border-0"
                >
                  <b className="text-sm uppercase">
                    {v.notification_type.replaceAll("_", " ")}
                  </b>
                  <p className="truncate text-sm">{v.recipient}</p>
                  <p className="truncate text-sm text-black/60">{v.subject}</p>
                  <span
                    className={`w-fit ${
                      v.status === "sent"
                        ? "text-xs font-bold uppercase text-green-700"
                        : "text-xs font-bold uppercase text-red-700"
                    }`}
                  >
                    {v.status}
                  </span>
                  <p className="text-sm text-black/45">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(v.created_at))}
                  </p>
                </div>
              ))}
              {!d.deliveries.length && (
                <p className="p-6 text-sm text-black/45">
                  No notification activity yet.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
