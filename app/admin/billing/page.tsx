import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { UpgradeButtons } from "./billing-client";

const TIER_LABELS: Record<string, string> = {
  none: "Base (free)",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
};

export default async function BillingPage() {
  const context = await getAdminContext();
  if (context.role !== "owner") redirect("/admin/dashboard");

  const supabase = await createClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("subscription_status, grace_period_ends_at, tier_flags")
    .eq("id", context.gymId)
    .single();

  const flags = context.tierFlags;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="mt-1 text-muted">Your plan and feature access.</p>

      <div className="mt-8 max-w-lg rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Status</p>
        <p className="mt-1 text-lg font-semibold">
          {TIER_LABELS[gym?.subscription_status ?? "none"] ?? gym?.subscription_status}
        </p>
        {gym?.grace_period_ends_at && (
          <p className="mt-2 text-sm text-amber-400">
            Payment issue — features stay active until{" "}
            {new Date(gym.grace_period_ends_at).toLocaleDateString()} unless resolved.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 text-sm">
          <FeatureRow label="Private lesson appointments" enabled={flags.private_lessons} />
          <FeatureRow label="Gym shop" enabled={flags.gym_shop} />
          <FeatureRow label="Email automations" enabled={flags.email_automation} />
          <FeatureRow label="Wearable connections" enabled={flags.wearables} />
        </div>
      </div>

      {gym?.subscription_status !== "active" && (
        <div className="mt-6 max-w-lg">
          <h2 className="mb-3 text-lg font-semibold">Upgrade</h2>
          <UpgradeButtons />
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2">
      <span>{label}</span>
      <span className={enabled ? "text-emerald-400" : "text-muted"}>
        {enabled ? "Included" : "Not included"}
      </span>
    </div>
  );
}
