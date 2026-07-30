"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AvailabilitySlotPicker } from "@/components/availability-slot-picker";

type Person = { id: string; full_name: string };

export function CreateAppointmentForm({
  gymId,
  members,
  instructors,
}: {
  gymId: string;
  members: Person[];
  instructors: Person[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [memberId, setMemberId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!range) {
      setError("Pick an open time slot.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("appointments").insert({
      gym_id: gymId,
      member_id: memberId,
      staff_id: staffId,
      start_at: range.start,
      end_at: range.end,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setMemberId("");
    setStaffId("");
    setRange(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Member</span>
          <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} className="input">
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </label>
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
      </div>
      {staffId && <AvailabilitySlotPicker instructorId={staffId} onSelect={(start, end) => setRange({ start, end })} />}
      <button
        type="submit"
        disabled={loading || !range}
        className="btn btn-primary w-fit"
      >
        {loading ? "Booking…" : "Book appointment"}
      </button>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
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
      className="text-xs font-medium"
      style={{ color: "var(--danger)" }}
    >
      Cancel
    </button>
  );
}
