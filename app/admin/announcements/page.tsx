import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { ComposeAnnouncement, AnnouncementFeed } from "./announcements-client";

export default async function AnnouncementsPage() {
  const context = await getAdminContext();
  const supabase = await createClient();

  const [{ data: announcements }, { data: staff }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, type, title, body, photo_url, pinned, created_at, author_staff_id, author_member_id")
      .order("created_at", { ascending: false }),
    supabase.from("staff").select("id, full_name"),
  ]);

  const staffNames = Object.fromEntries((staff ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Announcements</h1>
      <p className="mt-1 text-muted">Posts shared with your whole gym, staff and members.</p>

      <div className="mt-6">
        <ComposeAnnouncement gymId={context.gymId} staffId={context.staffId} />
      </div>

      <AnnouncementFeed announcements={announcements ?? []} staffNames={staffNames} />
    </div>
  );
}
