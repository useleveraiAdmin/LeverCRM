import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { ReplyForm } from "../messages-client";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getAdminContext();
  const supabase = await createClient();

  const [{ data: thread }, { data: messages }] = await Promise.all([
    supabase
      .from("message_threads")
      .select("id, subject, message_participants(member_id, members(full_name))")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, body, created_at, sender_staff_id, staff(full_name)")
      .eq("thread_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!thread) notFound();

  const participant = (thread.message_participants as unknown as { member_id: string; members: { full_name: string } | null }[])?.[0];
  const memberName = participant?.members?.full_name ?? "Unknown";

  return (
    <div>
      <h1 className="text-2xl font-semibold">{thread.subject || memberName}</h1>
      <p className="mt-1 text-muted">Conversation with {memberName}</p>

      <div className="card mt-6 flex flex-col gap-3">
        {(messages ?? []).map((m) => {
          const sender = m.staff as unknown as { full_name: string } | null;
          return (
            <div key={m.id}>
              <p className="text-sm">{m.body}</p>
              <p className="mt-0.5 text-xs text-muted">
                {sender?.full_name ?? "Staff"} · {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
        {(messages ?? []).length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
      </div>

      <ReplyForm gymId={context.gymId} threadId={id} staffId={context.staffId} />
    </div>
  );
}
