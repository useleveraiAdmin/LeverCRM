import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";
import { MemberNav } from "./member-nav";
import { MemberHeader } from "./member-header";
import { WaiverGate } from "./waiver-gate";

export default async function MemberAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  const supabase = await createClient();

  // Only gyms that have actually published a waiver gate members — a gym
  // that hasn't adopted this feature at all should never trap its members
  // with no way to satisfy it. Any signature on file (however it was
  // captured) clears the gate; re-signing on a new waiver version isn't
  // enforced yet.
  const { data: activeWaiver } = await supabase
    .from("waivers")
    .select("id, title, storage_path")
    .eq("gym_id", context.gymId)
    .eq("is_active", true)
    .maybeSingle();

  let gatePdfUrl: string | null = null;
  if (activeWaiver) {
    const { count } = await supabase
      .from("waiver_signatures")
      .select("id", { count: "exact", head: true })
      .eq("member_id", context.memberId);
    if ((count ?? 0) === 0) {
      const { data } = await supabase.storage.from("waiver-templates").createSignedUrl(activeWaiver.storage_path, 3600);
      gatePdfUrl = data?.signedUrl ?? null;
    }
  }

  return (
    <div
      className="member-shell flex flex-1 flex-col"
      style={
        {
          "--gym-primary": context.branding.primaryColor || undefined,
          "--gym-secondary": context.branding.secondaryColor || undefined,
          background: "var(--background)",
          color: "var(--foreground)",
        } as React.CSSProperties
      }
    >
      <MemberHeader gymName={context.gymName} />
      {activeWaiver && gatePdfUrl ? (
        <main className="app-main mx-auto w-full max-w-xl px-4 py-8">
          <WaiverGate
            waiverId={activeWaiver.id}
            waiverTitle={activeWaiver.title}
            pdfUrl={gatePdfUrl}
            memberId={context.memberId}
          />
        </main>
      ) : (
        <div className="app-grid">
          <MemberNav context={context} />
          <main className="app-main">{children}</main>
        </div>
      )}
    </div>
  );
}
