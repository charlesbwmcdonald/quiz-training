import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request:Request,{params}:{params:Promise<{programId:string}>}){
  const{programId}=await params,supabase=await createSupabaseServerClient();
  const{data:auth}=await supabase.auth.getUser();
  if(!auth.user)return NextResponse.redirect(new URL("/login",request.url));
  const{data:program}=await supabase.from("dealer_programs").select("title,flyer_path").eq("id",programId).single();
  if(!program?.flyer_path)return new NextResponse("Flyer not found",{status:404});
  const{data,error}=await supabase.storage.from("dealer-programs").download(program.flyer_path);
  if(error||!data)return new NextResponse("Flyer unavailable",{status:404});
  await supabase.rpc("record_dealer_program_event",{target_program_id:programId,target_event_type:"download"});
  const filename=`${program.title.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()||"dealer-program"}.pdf`;
  return new NextResponse(await data.arrayBuffer(),{headers:{"Content-Type":"application/pdf","Content-Disposition":`inline; filename="${filename}"`,"Cache-Control":"private, no-store"}});
}
