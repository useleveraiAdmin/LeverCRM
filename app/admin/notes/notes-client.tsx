"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Note = { id: string; body: string; pinned: boolean; created_at: string; author_staff_id: string };
type StaffMap = Record<string, string>;

export function TeamNotesFeed({
  gymId,
  staffId,
  notes,
  staffNames,
  canPin,
}: {
  gymId: string;
  staffId: string;
  notes: Note[];
  staffNames: StaffMap;
  canPin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await supabase.from("notes").insert({ gym_id: gymId, author_staff_id: staffId, body });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from("notes").update({ pinned: !pinned }).eq("id", id);
    router.refresh();
  }

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <form onSubmit={handleAdd} className="card flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share a note with the team…" className="input" />
        <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
          Post
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        {sorted.map((n) => (
          <div key={n.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p>{n.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {staffNames[n.author_staff_id] ?? "Staff"} ·{" "}
                  {new Date(n.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {n.pinned && <span className="badge badge-neutral">Pinned</span>}
            </div>
            {canPin && (
              <button className="mt-2 text-xs font-medium" style={{ color: "var(--gym-primary)" }} onClick={() => togglePin(n.id, n.pinned)}>
                {n.pinned ? "Unpin" : "Pin"}
              </button>
            )}
          </div>
        ))}
        {sorted.length === 0 && <p className="mt-4 text-sm text-muted">No team notes yet.</p>}
      </div>
    </div>
  );
}
