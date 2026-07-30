import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";
import { ComposeUpdate, UpdatesFeed } from "./updates-client";

export default async function UpdatesPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, type, title, body, photo_url, pinned, created_at, author_staff_id, author_member_id")
    .order("created_at", { ascending: false });

  const staffIds = [...new Set((announcements ?? []).map((a) => a.author_staff_id).filter(Boolean))] as string[];
  const memberIds = [...new Set((announcements ?? []).map((a) => a.author_member_id).filter(Boolean))] as string[];

  const [{ data: staff }, { data: members }] = await Promise.all([
    staffIds.length ? supabase.from("staff").select("id, full_name").in("id", staffIds) : Promise.resolve({ data: [] }),
    memberIds.length ? supabase.rpc("get_member_names", { p_member_ids: memberIds }) : Promise.resolve({ data: [] }),
  ]);

  const names: Record<string, string> = {};
  (staff ?? []).forEach((s) => (names[s.id] = s.full_name));
  (members ?? []).forEach((m) => (names[m.member_id] = m.full_name));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Updates</h1>
      <p className="mt-1 text-muted">What&apos;s happening at {context.gymName}.</p>

      <div className="mt-6">
        <ComposeUpdate gymId={context.gymId} memberId={context.memberId} />
      </div>

      <UpdatesFeed announcements={announcements ?? []} names={names} />
    </div>
  );
}
