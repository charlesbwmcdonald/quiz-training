import {NextResponse} from "next/server";
import type {EmailOtpType} from "@supabase/supabase-js";
import {createSupabaseServerClient} from "@/lib/supabase/server";

export async function GET(request:Request){
  const url=new URL(request.url);const tokenHash=url.searchParams.get("token_hash");const type=url.searchParams.get("type") as EmailOtpType|null;
  const requested=url.searchParams.get("next");
  let destination="/reset-password";
  if(requested){try{const nextUrl=new URL(requested,url.origin);if(nextUrl.origin===url.origin&&nextUrl.pathname==="/reset-password")destination=`${nextUrl.pathname}${nextUrl.search}`;}catch{if(requested.startsWith("/reset-password")&&!requested.startsWith("//"))destination=requested;}}
  if(tokenHash&&type){const supabase=await createSupabaseServerClient();const{error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type});if(!error){if(!destination.includes("brand=")){const{data:brandRows}=await supabase.rpc("get_active_manufacturer_brand");const slug=(brandRows?.[0] as{slug?:string}|undefined)?.slug;if(slug)destination=`/reset-password?brand=${encodeURIComponent(slug)}`;}return NextResponse.redirect(new URL(destination,url.origin));}}
  return NextResponse.redirect(new URL("/forgot-password?error=Reset+link+is+invalid+or+expired",url.origin));
}
