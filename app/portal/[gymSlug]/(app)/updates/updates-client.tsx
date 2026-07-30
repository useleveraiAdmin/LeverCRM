"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Announcement = {
  id: string;
  type: string;
  title: string | null;
  body: string;
  photo_url: string | null;
  pinned: boolean;
  created_at: string;
  author_staff_id: string | null;
  author_member_id: string | null;
};

export function ComposeUpdate({ gymId, memberId }: { gymId: string; memberId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await supabase.from("announcements").insert({ gym_id: gymId, author_member_id: memberId, body });
    setBody("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex gap-2">
      <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share something with the gym…" className="input" />
      <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
        Post
      </button>
    </form>
  );
}

export function UpdatesFeed({ announcements, names }: { announcements: Announcement[]; names: Record<string, string> }) {
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="mt-4 flex flex-col gap-3">
      {sorted.map((a) => (
        <div key={a.id} className="card">
          <div className="flex items-center gap-2">
            {a.author_staff_id && <span className="badge badge-neutral">Staff</span>}
            {a.pinned && <span className="badge badge-neutral">Pinned</span>}
          </div>
          {a.title && <p className="mt-2 font-semibold">{a.title}</p>}
          <p className="mt-1 text-sm">{a.body}</p>
          {a.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.photo_url} alt="" className="mt-2 max-h-48 w-full rounded-lg object-cover" />
          )}
          <p className="mt-2 text-xs text-muted">
            {a.author_staff_id ? names[a.author_staff_id] ?? "Staff" : names[a.author_member_id ?? ""] ?? "Member"} ·{" "}
            {new Date(a.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
      {sorted.length === 0 && <p className="text-sm text-muted">No updates yet.</p>}
    </div>
  );
}
