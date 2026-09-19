"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "/app");
  return path.startsWith("/app/") || path === "/app" ? path : "/app";
}

export async function reviewContent(formData: FormData) {
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const decision = String(formData.get("decision") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("review_content", {
    content_type: String(formData.get("contentType") ?? ""),
    target_content_id: String(formData.get("contentId") ?? ""),
    review_decision: decision,
    review_note: String(formData.get("note") ?? "").trim() || null,
  });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?reviewed=${decision}`);
}

export async function restoreContentVersion(formData: FormData) {
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("restore_content_version", {
    target_version_id: String(formData.get("versionId") ?? ""),
  });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?restored=1`);
}

export async function scheduleContentAction(formData: FormData) {
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("schedule_content_action", {
    content_type: String(formData.get("contentType") ?? ""),
    target_content_id: String(formData.get("contentId") ?? ""),
    schedule_action: String(formData.get("scheduleAction") ?? ""),
    scheduled_for: String(formData.get("scheduledForIso") ?? ""),
  });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?scheduled=1`);
}

export async function cancelContentSchedule(formData: FormData) {
  const returnTo = safeReturnPath(formData.get("returnTo"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_content_schedule", { target_schedule_id: String(formData.get("scheduleId") ?? "") });
  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${returnTo}?cancelled=1`);
}
