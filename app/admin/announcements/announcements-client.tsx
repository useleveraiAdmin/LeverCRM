"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POST_TYPES = [
  { value: "post", label: "Post" },
  { value: "event", label: "Event" },
  { value: "congrats", label: "Congrats" },
  { value: "reminder", label: "Reminder" },
  { value: "update", label: "Update" },
  { value: "challenge", label: "Challenge" },
  { value: "for_sale", label: "For sale" },
  { value: "lost_found", label: "Lost & found" },
];

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

export function ComposeAnnouncement({ gymId, staffId }: { gymId: string; staffId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [type, setType] = useState("post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    await supabase.from("announcements").insert({
      gym_id: gymId,
      author_staff_id: staffId,
      type,
      title: title || null,
      body,
      photo_url: photoUrl || null,
      pinned,
    });
    setTitle("");
    setBody("");
    setPhotoUrl("");
    setPinned(false);
    setType("post");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="input w-auto">
          {POST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="input flex-1" />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share something with the gym…"
        rows={3}
        className="input"
      />
      <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Photo URL (optional)" className="input" />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to top
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}

export function AnnouncementFeed({ announcements, staffNames }: { announcements: Announcement[]; staffNames: Record<string, string> }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    router.refresh();
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="mt-4 flex flex-col gap-3">
      {sorted.map((a) => (
        <div key={a.id} className="card">
          <div className="flex items-center gap-2">
            <span className="badge badge-neutral">{a.type.replace("_", " ")}</span>
            {a.pinned && <span className="badge badge-neutral">Pinned</span>}
            {a.author_staff_id && <span className="badge badge-neutral">Staff</span>}
          </div>
          {a.title && <p className="mt-2 font-semibold">{a.title}</p>}
          <p className="mt-1 text-sm">{a.body}</p>
          {a.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.photo_url} alt="" className="mt-2 max-h-48 rounded-lg object-cover" />
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted">
              {a.author_staff_id ? staffNames[a.author_staff_id] ?? "Staff" : "Member"} ·{" "}
              {new Date(a.created_at).toLocaleDateString()}
            </p>
            <button className="text-xs font-medium" style={{ color: "#ef4444" }} onClick={() => handleDelete(a.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
      {sorted.length === 0 && <p className="text-sm text-muted">No announcements yet.</p>}
    </div>
  );
}
