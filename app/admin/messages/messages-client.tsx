"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; full_name: string };

export function NewThreadForm({ gymId, staffId, members }: { gymId: string; staffId: string; members: Member[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !body.trim()) return;
    setLoading(true);
    setError(null);

    const { data: thread, error: threadError } = await supabase
      .from("message_threads")
      .insert({ gym_id: gymId })
      .select("id")
      .single();

    if (threadError || !thread) {
      setError(threadError?.message ?? "Could not start conversation.");
      setLoading(false);
      return;
    }

    const { error: participantError } = await supabase
      .from("message_participants")
      .insert({ thread_id: thread.id, member_id: memberId });

    if (participantError) {
      setError(participantError.message);
      setLoading(false);
      return;
    }

    const { error: messageError } = await supabase
      .from("messages")
      .insert({ gym_id: gymId, thread_id: thread.id, sender_staff_id: staffId, body });

    setLoading(false);
    if (messageError) {
      setError(messageError.message);
      return;
    }

    setBody("");
    setMemberId("");
    setOpen(false);
    router.push(`/admin/messages/${thread.id}`);
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + New message
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">To</span>
        <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="input">
          <option value="">Select a member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </label>
      <textarea
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message…"
        rows={3}
        className="input"
      />
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Sending…" : "Send"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ReplyForm({ gymId, threadId, staffId }: { gymId: string; threadId: string; staffId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await supabase.from("messages").insert({ gym_id: gymId, thread_id: threadId, sender_staff_id: staffId, body });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply…" className="input" />
      <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
        Send
      </button>
    </form>
  );
}
