"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeAvailableSlots, SLOT_MINUTES } from "@/lib/availability";

export function AvailabilitySlotPicker({
  instructorId,
  onSelect,
}: {
  instructorId: string;
  onSelect: (startAtIso: string, endAtIso: string) => void;
}) {
  const supabase = createClient();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instructorId || !date) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setSelected(null);

    (async () => {
      const d = new Date(`${date}T00:00:00`);
      const dayOfWeek = d.getDay();
      const dayStart = new Date(`${date}T00:00:00`).toISOString();
      const dayEnd = new Date(`${date}T23:59:59`).toISOString();

      const [{ data: windows }, { data: blocks }, { data: booked }] = await Promise.all([
        supabase
          .from("instructor_availability")
          .select("start_time, end_time")
          .eq("staff_id", instructorId)
          .eq("day_of_week", dayOfWeek),
        supabase.from("instructor_blocks").select("start_time, end_time").eq("staff_id", instructorId).eq("date", date),
        supabase
          .from("appointments")
          .select("start_at, end_at")
          .eq("staff_id", instructorId)
          .eq("status", "booked")
          .gte("start_at", dayStart)
          .lte("start_at", dayEnd),
      ]);

      if (cancelled) return;
      const computed = computeAvailableSlots(d, windows ?? [], blocks ?? [], booked ?? []);
      setSlots(computed);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [instructorId, date, supabase]);

  function handlePick(slot: string) {
    setSelected(slot);
    const [h, m] = slot.split(":").map(Number);
    const start = new Date(`${date}T00:00:00`);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
    onSelect(start.toISOString(), end.toISOString());
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Date</span>
        <input
          type="date"
          min={today}
          value={date}
          disabled={!instructorId}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />
      </label>
      {date && (
        <div>
          {loading && <p className="text-xs text-muted">Loading availability…</p>}
          {!loading && slots !== null && slots.length === 0 && (
            <p className="text-xs text-muted">No open slots that day.</p>
          )}
          {!loading && slots && slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handlePick(s)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  style={
                    selected === s
                      ? { background: "var(--gym-primary)", color: "#06202b", borderColor: "var(--gym-primary)" }
                      : { borderColor: "var(--border)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
