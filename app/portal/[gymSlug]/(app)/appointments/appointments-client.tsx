"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AvailabilitySlotPicker } from "@/components/availability-slot-picker";

type Instructor = { id: string; full_name: string; venmo_handle: string | null; cashapp_handle: string | null; zelle_handle: string | null; applecash_handle: string | null };

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
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInstructor = instructors.find((i) => i.id === staffId);

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

    setRange(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Instructor</span>
        <select required value={staffId} onChange={(e) => { setStaffId(e.target.value); setRange(null); }} className="input">
          <option value="">Select instructor</option>
          {instructors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </label>
      {staffId && <AvailabilitySlotPicker instructorId={staffId} onSelect={(start, end) => setRange({ start, end })} />}
      {selectedInstructor && (selectedInstructor.venmo_handle || selectedInstructor.cashapp_handle || selectedInstructor.zelle_handle || selectedInstructor.applecash_handle) && (
        <div className="rounded-lg border p-3 text-xs" style={{ borderColor: "var(--border)" }}>
          <p className="font-medium text-muted">Pay {selectedInstructor.full_name} directly:</p>
          <div className="mt-1 flex flex-wrap gap-3">
            {selectedInstructor.venmo_handle && <span>Venmo: {selectedInstructor.venmo_handle}</span>}
            {selectedInstructor.cashapp_handle && <span>Cash App: {selectedInstructor.cashapp_handle}</span>}
            {selectedInstructor.zelle_handle && <span>Zelle: {selectedInstructor.zelle_handle}</span>}
            {selectedInstructor.applecash_handle && <span>Apple Cash: {selectedInstructor.applecash_handle}</span>}
          </div>
        </div>
      )}
      <button type="submit" disabled={loading || !range} className="btn btn-primary w-fit">
        {loading ? "Booking…" : "Book"}
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
    <button onClick={handleCancel} disabled={loading} className="btn btn-outline">
      {loading ? "Cancelling…" : "Cancel"}
    </button>
  );
}
