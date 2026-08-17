"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createSupabaseServerClient} from "@/lib/supabase/server";

export async function updateRetailer(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const supabase = await createSupabaseServerClient();
  const {error} = await supabase.rpc("update_manufacturer_retailer", {
    target_company_id: companyId,
    retailer_name: String(formData.get("name") ?? ""),
    retailer_address_line_1: String(formData.get("addressLine1") ?? ""),
    retailer_address_line_2: String(formData.get("addressLine2") ?? ""),
    retailer_city: String(formData.get("city") ?? ""),
    retailer_state_region: String(formData.get("stateRegion") ?? ""),
    retailer_postal_code: String(formData.get("postalCode") ?? ""),
    retailer_phone: String(formData.get("phone") ?? ""),
    retailer_website: String(formData.get("website") ?? ""),
    retailer_contact_name: String(formData.get("contactName") ?? ""),
    retailer_contact_email: String(formData.get("contactEmail") ?? ""),
  });
  if (error) redirect(`/app/retailers/${companyId}/edit?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/retailers");
  revalidatePath("/app/assignments");
  redirect("/app/retailers?saved=1");
}
