import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const isAuthed = !!data.user;

  const pathname = request.nextUrl.pathname;
  const scopedMatch = pathname.match(/^\/m\/([^/]+)\/app(?:\/.*)?$/);
  const isManufacturerPortal = pathname.startsWith("/app") || Boolean(scopedMatch);

  if ((isManufacturerPortal || pathname.startsWith("/platform")) && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthed && isManufacturerPortal) {
    const { data: brandRows } = await supabase.rpc("get_active_manufacturer_brand");
    const activeSlug = (brandRows?.[0] as { slug?: string } | undefined)?.slug;

    if (activeSlug && pathname.startsWith("/app")) {
      const url = request.nextUrl.clone();
      url.pathname = `/m/${activeSlug}${pathname}`;
      return NextResponse.redirect(url);
    }

    if (activeSlug && scopedMatch) {
      const requestedSlug = decodeURIComponent(scopedMatch[1]);
      if (requestedSlug !== activeSlug) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.replace(`/m/${requestedSlug}/app`, `/m/${activeSlug}/app`);
        return NextResponse.redirect(url);
      }
      return response;
    }
  }

  if (pathname === "/login" && isAuthed) {
    const url = request.nextUrl.clone();
    const requestedNext = url.searchParams.get("next");
    const requestedBrand = url.searchParams.get("brand");
    const { data: brandRows } = await supabase.rpc("get_active_manufacturer_brand");
    const activeSlug = (brandRows?.[0] as { slug?: string } | undefined)?.slug;
    const { data: destination } = !requestedBrand && (!requestedNext || requestedNext === "/app") ? await supabase.rpc("get_post_login_destination") : { data: null };
    url.pathname = typeof destination === "string" && destination.startsWith("/") && !destination.startsWith("//") ? destination : requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : activeSlug ? `/m/${activeSlug}/app` : "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/m/:manufacturerSlug/app/:path*", "/platform/:path*", "/login"],
};
