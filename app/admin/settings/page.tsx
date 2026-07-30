import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { AdminPinSection, LevelsSection } from "./settings-client";

export default async function SettingsPage() {
  const context = await getAdminContext();
  if (context.role !== "owner") redirect("/admin/dashboard");

  const supabase = await createClient();
  const [{ data: levels }, { data: hasPinData }] = await Promise.all([
    supabase.from("gym_levels").select("id, name, sort_order").order("sort_order"),
    supabase.rpc("has_admin_pin"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-muted">Gym-wide configuration.</p>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Admin PIN</h2>
        <div className="mt-4">
          <AdminPinSection hasPin={hasPinData ?? false} />
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Payments</h2>
        <p className="mt-2 text-sm text-muted">
          Gym shop and package purchases are reserved online and paid for in person (cash, card reader,
          or however you already collect payment at the front desk) — LeverCRM doesn&apos;t process payments
          for you yet. Card/terminal processor integration is planned for a future update.
        </p>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Member levels</h2>
        <p className="mt-1 text-sm text-muted">
          Define your own level or rank system — shown on client profiles instead of a fixed belt system.
        </p>
        <div className="mt-4">
          <LevelsSection gymId={context.gymId} levels={levels ?? []} />
        </div>
      </div>
    </div>
  );
}
