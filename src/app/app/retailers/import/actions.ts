"use server";

import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";

type Row = Record<string,string>;

export async function importRetailers(formData:FormData) {
  let rows:Row[];
  try { rows=JSON.parse(String(formData.get("rows")??"[]")); }
  catch { redirect("/app/retailers/import?error=The+CSV+data+could+not+be+read."); }
  const supabase=await createSupabaseServerClient();
  let created=0,updated=0;
  for(const row of rows!){
    if(!row.name?.trim())continue;
    const {data,error}=await supabase.rpc("import_manufacturer_retailer",{retailer_name:row.name,retailer_address_line_1:row.address_line_1||null,retailer_address_line_2:row.address_line_2||null,retailer_city:row.city||null,retailer_state_region:row.state_region||null,retailer_postal_code:row.postal_code||null,retailer_phone:row.phone||null,retailer_website:row.website||null,retailer_contact_name:row.contact_name||null,retailer_contact_email:row.contact_email||null});
    if(error)redirect(`/app/retailers/import?error=${encodeURIComponent(`${row.name}: ${error.message}`)}`);
    if(data==="created")created++;else updated++;
  }
  redirect(`/app/retailers?imported=${created}&updated=${updated}`);
}
