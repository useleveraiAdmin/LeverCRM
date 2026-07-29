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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-muted">Keep your details up to date.</p>

      <div className="mt-8 max-w-md rounded-xl border border-border bg-surface p-6">
        <ProfileForm
          memberId={context.memberId}
          initialFullName={member?.full_name ?? ""}
          initialPhone={member?.phone ?? null}
          initialDob={member?.date_of_birth ?? null}
          initialPictureUrl={member?.profile_picture_url ?? null}
        />
      </div>
    </div>
  );
}
