import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Redirect back to /login on the same domain you're currently on
  const requestUrl=new URL(request.url);const brand=requestUrl.searchParams.get("brand");
  const url = new URL("/login", request.url);
  if(brand&&/^[a-z0-9-]+$/.test(brand))url.searchParams.set("brand",brand);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: Request) {
  const requestUrl=new URL(request.url);const brand=requestUrl.searchParams.get("brand");const url=new URL("/login",request.url);if(brand&&/^[a-z0-9-]+$/.test(brand))url.searchParams.set("brand",brand);return NextResponse.redirect(url);
}
