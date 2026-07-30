import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { TeamNotesFeed } from "./notes-client";

export default async function NotesPage() {
  const context = await getAdminContext();
  const supabase = await createClient();

  const [{ data: notes }, { data: staff }] = await Promise.all([
    supabase.from("notes").select("id, body, pinned, created_at, author_staff_id").is("member_id", null).order("created_at", { ascending: false }),
    supabase.from("staff").select("id, full_name"),
  ]);

  const staffNames = Object.fromEntries((staff ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Team notes</h1>
      <p className="mt-1 text-muted">Internal notes visible to staff only.</p>

      <div className="mt-6">
        <TeamNotesFeed
          gymId={context.gymId}
          staffId={context.staffId}
          notes={notes ?? []}
          staffNames={staffNames}
          canPin={context.role === "owner"}
        />
      </div>
    </div>
  );
}
