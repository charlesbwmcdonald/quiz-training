"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const clean = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const optionalNumber = (value: FormDataEntryValue | null) => {
  const text = clean(value);
  return text === "" ? null : Number(text);
};

export async function redeemReward(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const brand = await getActiveBrand();
  const { data, error } = await supabase.rpc("redeem_reward", {
    target_reward_id: clean(formData.get("rewardId")),
    target_name: clean(formData.get("name")),
    target_email: clean(formData.get("email")),
    target_phone: clean(formData.get("phone")),
    target_address_1: clean(formData.get("address1")),
    target_address_2: clean(formData.get("address2")),
    target_city: clean(formData.get("city")),
    target_state: clean(formData.get("state")),
    target_postal_code: clean(formData.get("postalCode")),
  });
  if (error) redirect(`/app/rewards?error=${encodeURIComponent(error.message)}`);

  const result = data as { id?: string; reward_name?: string; fulfillment_email?: string | null } | null;
  if (result?.fulfillment_email && brand) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "JobberTrain <invites@auth.jobbertrain.com>",
          to: [result.fulfillment_email],
          subject: `${brand.name} reward redemption requested`,
          html: `<div style="font-family:Arial;padding:32px;border-top:8px solid ${brand.primary_color}"><h1>New reward redemption</h1><p><b>${clean(formData.get("name"))}</b> requested <b>${result.reward_name ?? "a reward"}</b>.</p><p>Open the ${brand.name} Academy Rewards dashboard to review and fulfill it.</p><p><b>Powered by JobberTrain</b></p></div>`,
        }),
      });
    } catch {
      // The fulfillment dashboard remains the source of truth if email is unavailable.
    }
  }
  revalidatePath("/app/rewards");
  redirect("/app/rewards?redeemed=1");
}

export async function saveRewardSettings(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_reward_settings", {
    rewards_enabled: formData.get("enabled") === "on",
    default_course_points: Number(formData.get("coursePoints") || 0),
    default_quiz_points: Number(formData.get("quizPoints") || 0),
    default_certification_bonus: Number(formData.get("certificationPoints") || 0),
    target_fulfillment_email: clean(formData.get("fulfillmentEmail")),
  });
  if (error) redirect(`/app/rewards/manage?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/rewards/manage");
  redirect("/app/rewards/manage?saved=1");
}

export async function saveRewardItem(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_reward_item", {
    target_id: clean(formData.get("rewardId")) || null,
    item_name: clean(formData.get("name")),
    item_description: clean(formData.get("description")),
    item_image_url: clean(formData.get("imageUrl")),
    item_points_cost: Number(formData.get("pointsCost") || 0),
    item_inventory: optionalNumber(formData.get("inventory")),
    item_limit: optionalNumber(formData.get("perUserLimit")),
    item_status: clean(formData.get("status")) || "draft",
  });
  if (error) redirect(`/app/rewards/manage?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/rewards/manage");
  redirect("/app/rewards/manage?itemSaved=1");
}

export async function archiveRewardItem(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_reward_item", {
    target_reward_id: clean(formData.get("rewardId")),
  });
  if (error) redirect(`/app/rewards/manage?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/rewards/manage");
  redirect("/app/rewards/manage?archived=1");
}

export async function updateRedemption(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_reward_redemption", {
    target_redemption_id: clean(formData.get("redemptionId")),
    next_status: clean(formData.get("status")),
    target_tracking: clean(formData.get("tracking")),
    target_notes: clean(formData.get("notes")),
  });
  if (error) redirect(`/app/rewards/manage?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/rewards/manage");
  redirect("/app/rewards/manage?updated=1");
}
