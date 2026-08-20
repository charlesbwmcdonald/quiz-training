import { createClient } from "@supabase/supabase-js";
type Row = {
  manufacturer_id: string;
  manufacturer_name: string;
  manufacturer_slug: string;
  logo_url: string | null;
  primary_color: string;
  recipient: string;
  notification_type: string;
  content_title: string;
  due_at?: string;
  message?: string;
  dedupe_key: string;
};
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response("Unauthorized", { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY)
    return Response.json(
      { error: "Scheduled email secrets are not configured" },
      { status: 503 },
    );
  const s = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } },
    ),
    runDate = new Date().toISOString().slice(0, 10),
    [{ data: reminderData, error: reminderError }, { data: achievementData, error: achievementError }] = await Promise.all([
      s.rpc("scheduled_notification_queue", { run_date: runDate }),
      s.rpc("scheduled_achievement_queue", { run_date: runDate }),
    ]),
    data = [...(reminderData ?? []), ...(achievementData ?? [])];
  if (reminderError || achievementError) return Response.json({ error: reminderError?.message || achievementError?.message }, { status: 500 });
  let sent = 0,
    failed = 0;
  for (const r of (data ?? []) as Row[]) {
    const accent = /^#[0-9a-f]{6}$/i.test(r.primary_color)
        ? r.primary_color
        : "#ff4f1f",
      overdue = r.notification_type === "overdue",
      subject = r.notification_type === "certificate" ? `Certificate earned: ${r.content_title}` : r.notification_type === "certified_dealer" ? `Certified Dealer achieved: ${r.content_title}` : r.notification_type === "weekly_summary" ? r.content_title : overdue ? `Overdue: ${r.content_title}` : `Due soon: ${r.content_title}`,
      destination = ["certificate"].includes(r.notification_type) ? "certificates" : ["certified_dealer","weekly_summary"].includes(r.notification_type) ? "certifications" : "my-training",
      url = `${process.env.NEXT_PUBLIC_SITE_URL}/m/${r.manufacturer_slug}/app/${destination}`,
      label = r.notification_type.replaceAll("_", " "),
      message = r.message || (overdue ? "This required training is past its due date." : `Please complete this training by ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(r.due_at!))}.`),
      html = `<div style="font-family:Arial;padding:40px;border-top:8px solid ${accent}">${r.logo_url ? `<img src="${r.logo_url}" style="max-width:180px;max-height:55px">` : ""}<p style="color:${accent};font-weight:bold;text-transform:uppercase">${label}</p><h1>${r.content_title}</h1><p>${message}</p><a href="${url}" style="display:inline-block;background:${accent};color:white;padding:15px 22px;text-decoration:none;font-weight:bold">Open Academy</a><p style="margin-top:30px;color:#777">${r.manufacturer_name} Academy · Powered by JobberTrain</p></div>`;
    let status = "failed",
      provider = "",
      deliveryError = "";
    try {
      const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": r.dedupe_key,
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM_EMAIL ||
              "JobberTrain <invites@auth.jobbertrain.com>",
            to: [r.recipient],
            subject,
            html,
          }),
        }),
        result = await response.json();
      if (response.ok) {
        status = "sent";
        provider = result.id;
        sent++;
      } else {
        deliveryError = result.message || String(response.status);
        failed++;
      }
    } catch (e) {
      deliveryError = e instanceof Error ? e.message : "Delivery failed";
      failed++;
    }
    await s
      .from("notification_deliveries")
      .insert({
        manufacturer_id: r.manufacturer_id,
        notification_type: r.notification_type,
        recipient: r.recipient,
        subject,
        status,
        provider_id: provider || null,
        error: deliveryError || null,
        dedupe_key: r.dedupe_key,
      });
  }
  return Response.json({ queued: (data ?? []).length, sent, failed });
}
