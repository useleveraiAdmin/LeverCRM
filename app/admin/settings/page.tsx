import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { AdminPinSection, LevelsSection, WaiverUploadForm } from "./settings-client";

export default async function SettingsPage() {
  const context = await getAdminContext();
  if (context.role !== "owner") redirect("/admin/dashboard");

  const supabase = await createClient();
  const [{ data: levels }, { data: hasPinData }, { data: waivers }] = await Promise.all([
    supabase.from("gym_levels").select("id, name, sort_order").order("sort_order"),
    supabase.rpc("has_admin_pin"),
    supabase
      .from("waivers")
      .select("id, title, version, is_active, created_at, storage_path")
      .eq("gym_id", context.gymId)
      .order("version", { ascending: false }),
  ]);

  const activeWaiver = (waivers ?? []).find((w) => w.is_active) ?? null;
  const waiverHistory = (waivers ?? []).filter((w) => !w.is_active);
  const nextWaiverVersion = (waivers?.[0]?.version ?? 0) + 1;

  let activeWaiverPdfUrl: string | null = null;
  if (activeWaiver) {
    const { data } = await supabase.storage.from("waiver-templates").createSignedUrl(activeWaiver.storage_path, 3600);
    activeWaiverPdfUrl = data?.signedUrl ?? null;
  }

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
        <h2 className="text-lg font-semibold">Waiver</h2>
        <p className="mt-1 text-sm text-muted">
          Upload the liability waiver clients sign at signup. Clients can sign in-app (with you present or on their
          own first login), or you can upload a waiver already signed elsewhere — see each client&apos;s profile.
        </p>

        {activeWaiver ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className="text-sm font-medium">{activeWaiver.title}</p>
              <p className="text-xs text-muted">
                Version {activeWaiver.version} · published {new Date(activeWaiver.created_at).toLocaleDateString()}
              </p>
            </div>
            {activeWaiverPdfUrl && (
              <a href={activeWaiverPdfUrl} target="_blank" rel="noreferrer" className="text-sm font-medium" style={{ color: "var(--gym-primary)" }}>
                View PDF
              </a>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No waiver uploaded yet — clients won&apos;t be prompted to sign in-app.</p>
        )}

        <div className="mt-4">
          <WaiverUploadForm
            gymId={context.gymId}
            staffId={context.staffId}
            activeWaiverId={activeWaiver?.id ?? null}
            nextVersion={nextWaiverVersion}
          />
        </div>

        {waiverHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted">Previous versions</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {waiverHistory.map((w) => (
                <div key={w.id} className="flex items-center justify-between text-sm">
                  <span>
                    {w.title} · v{w.version}
                  </span>
                  <span className="text-muted">{new Date(w.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
