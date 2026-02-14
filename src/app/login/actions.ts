"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("LOGIN ERROR:", error.message);
    redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    console.error("LOGIN ERROR: No session returned.");
    redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent("No session returned")}`);
  }

  redirect(next);
}
