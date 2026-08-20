import type { SupabaseClient } from "@supabase/supabase-js";

type InvitationEmailPayload = {
  id: string;
  email: string;
  invitation_type: string;
  role: string;
  status: string;
  expires_at: string;
  manufacturer_name: string;
  company_name: string | null;
  logo_url: string | null;
  primary_color: string;
  email_attempts: number;
};

export type InvitationEmailResult = { sent: boolean; configured: boolean; message: string };

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);

function appUrl(origin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const value = configured || origin || "http://localhost:3000";
  return value.replace(/\/$/, "");
}

async function recordDelivery(supabase: SupabaseClient, invitationId: string, status: "sent" | "failed" | "not_configured", providerId?: string, error?: string) {
  await supabase.rpc("record_invitation_email_delivery", {
    target_invitation_id: invitationId,
    delivery_status: status,
    provider_message_id: providerId ?? null,
    delivery_error: error?.slice(0, 500) ?? null,
  });
}

export async function sendInvitationEmail(supabase: SupabaseClient, invitationId: string, origin?: string): Promise<InvitationEmailResult> {
  const { data, error } = await supabase.rpc("get_invitation_email_payload", { target_invitation_id: invitationId });
  if (error || !data) return { sent: false, configured: true, message: error?.message || "Invitation could not be prepared." };

  const invite = data as InvitationEmailPayload;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    await recordDelivery(supabase, invitationId, "not_configured", undefined, "Email delivery is waiting for the Resend API key.");
    return { sent: false, configured: false, message: "Invitation created. Email delivery will activate after Resend is connected." };
  }

  const academy = invite.invitation_type === "platform_owner" ? "JobberTrain" : `${invite.manufacturer_name} Academy`;
  const organization = invite.company_name || invite.manufacturer_name;
  const accent = /^#[0-9a-f]{6}$/i.test(invite.primary_color) ? invite.primary_color : "#ff4f1f";
  const inviteUrl = `${appUrl(origin)}/invite/${invite.id}`;
  const expires = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(invite.expires_at));
  const subject = `You’re invited to ${academy}`;
  const logo = invite.logo_url ? `<img src="${escapeHtml(invite.logo_url)}" alt="${escapeHtml(invite.manufacturer_name)}" style="display:block;max-width:190px;max-height:58px;margin:0 0 28px">` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f3f3f1;font-family:Arial,sans-serif;color:#171717"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:auto;background:#fff;border:1px solid #ddd"><tr><td style="height:8px;background:${accent}"></td></tr><tr><td style="padding:42px">${logo}<div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${accent}">Private training invitation</div><h1 style="font-size:32px;line-height:1.1;margin:14px 0 18px;text-transform:uppercase">You’re invited to ${escapeHtml(academy)}</h1><p style="font-size:17px;line-height:1.6;color:#555;margin:0 0 18px">${escapeHtml(organization)} has invited you to access product knowledge, courses, quizzes, and assigned training.</p><p style="font-size:14px;line-height:1.6;color:#777;margin:0 0 28px">Use your existing JobberTrain account or create one universal account with this email address. This invitation expires ${escapeHtml(expires)}.</p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-size:14px;font-weight:800;text-transform:uppercase;padding:16px 24px">Accept invitation</a><p style="font-size:12px;line-height:1.6;color:#999;margin:28px 0 0">If the button does not work, copy this link:<br><a href="${escapeHtml(inviteUrl)}" style="color:#555;word-break:break-all">${escapeHtml(inviteUrl)}</a></p></td></tr><tr><td style="padding:22px 42px;background:#171717;color:#aaa;font-size:12px">${escapeHtml(academy)} &nbsp;·&nbsp; Powered by JobberTrain</td></tr></table></td></tr></table></body></html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `jobbertrain-invite-${invite.id}-${invite.email_attempts + 1}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "JobberTrain <invites@auth.jobbertrain.com>",
        to: [invite.email],
        reply_to: process.env.RESEND_REPLY_TO?.trim() || undefined,
        subject,
        html,
      }),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok || !result.id) {
      const message = result.message || result.name || `Resend returned ${response.status}.`;
      await recordDelivery(supabase, invitationId, "failed", undefined, message);
      return { sent: false, configured: true, message };
    }
    await recordDelivery(supabase, invitationId, "sent", result.id);
    return { sent: true, configured: true, message: "Invitation email sent." };
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Email provider could not be reached.";
    await recordDelivery(supabase, invitationId, "failed", undefined, message);
    return { sent: false, configured: true, message };
  }
}
