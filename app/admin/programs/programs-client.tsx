"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Program = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  highlights: string[];
  level_tags: string[];
};

export function CreateProgramForm({ gymId, canManage }: { gymId: string; canManage: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [loading, setLoading] = useState(false);

  if (!canManage) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("programs").insert({
      gym_id: gymId,
      name,
      tagline: tagline || null,
      description: description || null,
      highlights: highlights
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
    });
    setName("");
    setTagline("");
    setDescription("");
    setHighlights("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Program name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Tagline</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="input" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={2} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Highlights (one per line)</span>
        <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} className="input" rows={3} />
      </label>
      <button type="submit" disabled={loading} className="btn btn-primary w-fit">
        {loading ? "Adding…" : "Add program"}
      </button>
    </form>
  );
}

export function ProgramsList({ programs, canManage }: { programs: Program[]; canManage: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(id: string) {
    if (!confirm("Remove this program?")) return;
    await supabase.from("programs").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {programs.map((p) => (
        <div key={p.id} className="card">
          <p className="font-semibold">{p.name}</p>
          {p.tagline && <p className="text-sm text-muted">{p.tagline}</p>}
          {p.description && <p className="mt-2 text-sm">{p.description}</p>}
          {p.highlights.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
              {p.highlights.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          )}
          {canManage && (
            <button className="btn-danger-text mt-3" onClick={() => handleDelete(p.id)}>
              Remove
            </button>
          )}
        </div>
      ))}
      {programs.length === 0 && <p className="text-sm text-muted">No programs added yet.</p>}
    </div>
  );
}
