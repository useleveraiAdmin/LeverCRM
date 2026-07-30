import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { NewThreadForm } from "./messages-client";

export default async function MessagesPage() {
  const context = await getAdminContext();
  const supabase = await createClient();

  const [{ data: threads }, { data: members }] = await Promise.all([
    supabase
      .from("message_threads")
      .select("id, subject, last_message_at, message_participants(member_id, members(full_name))")
      .order("last_message_at", { ascending: false }),
    supabase.from("members").select("id, full_name").order("full_name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <p className="mt-1 text-muted">Direct conversations with your members.</p>

      <div className="mt-6">
        <NewThreadForm gymId={context.gymId} staffId={context.staffId} members={members ?? []} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {(threads ?? []).map((t) => {
          const participant = (t.message_participants as unknown as { member_id: string; members: { full_name: string } | null }[])?.[0];
          const name = participant?.members?.full_name ?? "Unknown";
          return (
            <Link key={t.id} href={`/admin/messages/${t.id}`} className="card flex items-center justify-between transition hover:opacity-90">
              <span className="font-medium">{t.subject || name}</span>
              <span className="text-xs text-muted">{new Date(t.last_message_at).toLocaleString()}</span>
            </Link>
          );
        })}
        {(threads ?? []).length === 0 && <p className="text-sm text-muted">No conversations yet.</p>}
      </div>
    </div>
  );
}
