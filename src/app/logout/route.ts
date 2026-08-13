import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Redirect back to /login on the same domain you're currently on
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}
