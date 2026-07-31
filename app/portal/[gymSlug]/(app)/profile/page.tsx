import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";
import { ProfileForm } from "./profile-client";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("full_name, phone, date_of_birth, profile_picture_url")
    .eq("id", context.memberId)
    .single();

  const { data: waiverSigRows } = await supabase
    .from("waiver_signatures")
    .select("id, capture_method, signed_at, final_pdf_path")
    .eq("member_id", context.memberId)
    .order("signed_at", { ascending: false });

  const waivers = await Promise.all(
    (waiverSigRows ?? []).map(async (s) => {
      const { data } = await supabase.storage.from("signed-waivers").createSignedUrl(s.final_pdf_path, 3600);
      return { id: s.id, captureMethod: s.capture_method, signedAt: s.signed_at, downloadUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-muted">Keep your details up to date.</p>

      <div className="card mt-8 max-w-md">
        <ProfileForm
          gymId={context.gymId}
          memberId={context.memberId}
          initialFullName={member?.full_name ?? ""}
          initialPhone={member?.phone ?? null}
          initialDob={member?.date_of_birth ?? null}
          initialPictureUrl={member?.profile_picture_url ?? null}
        />
      </div>

      <div className="card mt-6 max-w-md">
        <h2 className="text-lg font-semibold">Waivers</h2>
        <div className="mt-3 flex flex-col gap-2">
          {waivers.map((w) => (
            <div key={w.id} className="flex items-center justify-between text-sm">
              <span className="text-muted">{new Date(w.signedAt).toLocaleDateString()}</span>
              {w.downloadUrl && (
                <a href={w.downloadUrl} target="_blank" rel="noreferrer" className="font-medium" style={{ color: "var(--gym-primary)" }}>
                  Download PDF
                </a>
              )}
            </div>
          ))}
          {waivers.length === 0 && <p className="text-sm text-muted">No signed waivers on file.</p>}
        </div>
      </div>
    </div>
  );
}
