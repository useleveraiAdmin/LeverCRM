import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { deriveTierLabel } from "@/lib/tiers";
import { UpgradeButtons } from "./billing-client";

const STATUS_LABELS: Record<string, string> = {
  none: "No active subscription",
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
  const tierLabel = deriveTierLabel(flags);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="mt-1 text-muted">Your plan and feature access.</p>

      <div className="card mt-8 max-w-lg">
        <p className="text-sm text-muted">Subscription tier</p>
        <p className="mt-1 text-2xl font-semibold">{tierLabel}</p>
        <p className="mt-2 text-sm text-muted">
          Payment status: {STATUS_LABELS[gym?.subscription_status ?? "none"] ?? gym?.subscription_status}
        </p>
        {gym?.grace_period_ends_at && (
          <p className="mt-2 text-sm" style={{ color: "var(--warning-fg)" }}>
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
    <div className="flex items-center justify-between border-b py-2" style={{ borderColor: "var(--border)" }}>
      <span>{label}</span>
      <span style={{ color: enabled ? "var(--success)" : "var(--muted)" }}>
        {enabled ? "Included" : "Not included"}
      </span>
    </div>
  );
}
