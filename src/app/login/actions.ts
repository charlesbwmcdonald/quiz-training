"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/app");
  const brand = String(formData.get("brand") ?? "");
  const force = String(formData.get("force") ?? "") === "1";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/app";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("LOGIN ERROR:", error.message);
    redirect(`/login?next=${encodeURIComponent(next)}${brand ? `&brand=${encodeURIComponent(brand)}` : ""}${force ? "&force=1" : ""}&error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    console.error("LOGIN ERROR: No session returned.");
    redirect(`/login?next=${encodeURIComponent(next)}${brand ? `&brand=${encodeURIComponent(brand)}` : ""}${force ? "&force=1" : ""}&error=${encodeURIComponent("No session returned")}`);
  }

  const invitationMatch = next.match(/^\/invite\/([0-9a-f-]{36})\/accept$/i);
  if (invitationMatch) {
    const { error: invitationError } = await supabase.rpc("accept_training_invitation", {
      invitation_token: invitationMatch[1],
    });
    if (invitationError) {
      redirect(`/invite/${invitationMatch[1]}?error=${encodeURIComponent(invitationError.message)}`);
    }
    const { data: destination } = await supabase.rpc("get_post_login_destination");
    redirect(typeof destination === "string" && destination.startsWith("/") && !destination.startsWith("//") ? destination : "/app");
  }

  if (!brand && next === "/app") {
    const { data: destination } = await supabase.rpc("get_post_login_destination");
    if (typeof destination === "string" && destination.startsWith("/") && !destination.startsWith("//")) redirect(destination);
  }

  redirect(next);
}
