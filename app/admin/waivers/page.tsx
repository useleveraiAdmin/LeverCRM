import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { WaiverUploadForm } from "./waivers-client";

export default async function WaiversPage() {
  const context = await getAdminContext();
  if (!["owner", "manager"].includes(context.role)) redirect("/admin/dashboard");

  const supabase = await createClient();
  const { data: waivers } = await supabase
    .from("waivers")
    .select("id, title, version, is_active, created_at, storage_path")
    .eq("gym_id", context.gymId)
    .order("version", { ascending: false });

  const active = (waivers ?? []).find((w) => w.is_active) ?? null;
  const history = (waivers ?? []).filter((w) => !w.is_active);
  const nextVersion = (waivers?.[0]?.version ?? 0) + 1;

  let activePdfUrl: string | null = null;
  if (active) {
    const { data } = await supabase.storage.from("waiver-templates").createSignedUrl(active.storage_path, 3600);
    activePdfUrl = data?.signedUrl ?? null;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Waivers</h1>
      <p className="mt-1 text-muted">
        Upload the liability waiver clients sign at signup. Clients can sign in-app (with you present or on their
        own first login), or you can upload a waiver already signed elsewhere — see each client&apos;s profile.
      </p>

      <div className="card mt-6 max-w-xl">
        <h2 className="text-lg font-semibold">Current waiver</h2>
        {active ? (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{active.title}</p>
              <p className="text-xs text-muted">
                Version {active.version} · published {new Date(active.created_at).toLocaleDateString()}
              </p>
            </div>
            {activePdfUrl && (
              <a href={activePdfUrl} target="_blank" rel="noreferrer" className="text-sm font-medium" style={{ color: "var(--gym-primary)" }}>
                View PDF
              </a>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No waiver uploaded yet — clients won&apos;t be prompted to sign in-app.</p>
        )}
      </div>

      <div className="card mt-6 max-w-xl">
        <h2 className="text-lg font-semibold">{active ? "Publish a new version" : "Upload a waiver"}</h2>
        <div className="mt-4">
          <WaiverUploadForm gymId={context.gymId} staffId={context.staffId} activeWaiverId={active?.id ?? null} nextVersion={nextVersion} />
        </div>
      </div>

      {history.length > 0 && (
        <div className="card mt-6 max-w-xl">
          <h2 className="text-lg font-semibold">Previous versions</h2>
          <div className="mt-3 flex flex-col gap-2">
            {history.map((w) => (
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
  );
}
