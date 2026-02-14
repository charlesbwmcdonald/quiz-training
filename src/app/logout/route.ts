import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Redirect back to /login on the same domain you're currently on
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
