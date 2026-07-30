"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Instructor = { id: string; full_name: string };

export function CreateClassForm({
  instructors,
  canManage,
  gymId,
}: {
  instructors: Instructor[];
  canManage: boolean;
  gymId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [capacity, setCapacity] = useState(12);
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const start = new Date(startAt);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const { error: insertError } = await supabase.from("classes").insert({
      gym_id: gymId,
      name,
      description: description || null,
      instructor_staff_id: instructorId || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      capacity,
      waitlist_enabled: waitlistEnabled,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setStartAt("");
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Add class
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Class name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Instructor</span>
          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="input"
          >
            <option value="">Unassigned</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Starts at</span>
          <input
            required
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Duration (minutes)</span>
          <input
            required
            type="number"
            min={15}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Capacity</span>
          <input
            required
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={waitlistEnabled}
            onChange={(e) => setWaitlistEnabled(e.target.checked)}
          />
          <span className="text-sm">Enable waitlist when full</span>
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Description (optional)</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      </label>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary w-fit">
          {loading ? "Creating…" : "Add class"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DeleteClassButton({ classId, canManage }: { classId: string; canManage: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  if (!canManage) return null;

  async function handleDelete() {
    if (!confirm("Cancel and remove this class?")) return;
    setLoading(true);
    await supabase.from("classes").delete().eq("id", classId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-medium text-red-400 hover:underline"
    >
      Remove
    </button>
  );
}
