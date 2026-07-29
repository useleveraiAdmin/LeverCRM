"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Instructor = { id: string; full_name: string };

export function BookAppointmentForm({
  gymId,
  memberId,
  instructors,
}: {
  gymId: string;
  memberId: string;
  instructors: Instructor[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [staffId, setStaffId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const start = new Date(startAt);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("staff_id", staffId)
      .eq("status", "booked")
      .lt("start_at", end.toISOString())
      .gt("end_at", start.toISOString());

    if (conflicts && conflicts.length > 0) {
      setError("That instructor is already booked at that time.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      gym_id: gymId,
      member_id: memberId,
      staff_id: staffId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setStartAt("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Instructor</span>
        <select required value={staffId} onChange={(e) => setStaffId(e.target.value)} className="input">
          <option value="">Select instructor</option>
          {instructors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
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
        <span className="text-xs font-medium text-muted">Duration (min)</span>
        <input
          required
          type="number"
          min={15}
          step={15}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="input w-24"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gym-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Booking…" : "Book"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
    >
      {loading ? "Cancelling…" : "Cancel"}
    </button>
  );
}
