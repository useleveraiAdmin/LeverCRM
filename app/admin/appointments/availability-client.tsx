"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dayOfWeekName } from "@/lib/availability";

type AvailRow = { id: string; day_of_week: number; start_time: string; end_time: string };

export function WeeklyAvailability({ gymId, staffId, rows }: { gymId: string; staffId: string; rows: AvailRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: insertError } = await supabase.from("instructor_availability").insert({
      gym_id: gymId,
      staff_id: staffId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.refresh();
  }

  async function handleRemove(id: string) {
    await supabase.from("instructor_availability").delete().eq("id", id);
    router.refresh();
  }

  const sorted = [...rows].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Day</span>
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="input">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {dayOfWeekName(d)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">From</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">To</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary">
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {sorted.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
            <span>
              {dayOfWeekName(r.day_of_week)} · {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
            </span>
            <button className="btn-danger-text" onClick={() => handleRemove(r.id)}>
              Remove
            </button>
          </div>
        ))}
        {sorted.length === 0 && <p className="mt-2 text-sm text-muted">No weekly availability set yet.</p>}
      </div>
    </div>
  );
}

type BlockRow = { id: string; date: string; start_time: string | null; end_time: string | null; reason: string | null };

export function BlockedDates({ gymId, staffId, blocks }: { gymId: string; staffId: string; blocks: BlockRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [date, setDate] = useState("");
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    await supabase.from("instructor_blocks").insert({
      gym_id: gymId,
      staff_id: staffId,
      date,
      start_time: fullDay ? null : startTime,
      end_time: fullDay ? null : endTime,
      reason: reason || null,
    });
    setDate("");
    setReason("");
    setLoading(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    await supabase.from("instructor_blocks").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Date</span>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={fullDay} onChange={(e) => setFullDay(e.target.checked)} />
          Full day
        </label>
        {!fullDay && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">From</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">To</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
            </label>
          </>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Reason (optional)</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="input" />
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary">
          Block
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {blocks.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
            <span>
              {new Date(`${b.date}T00:00:00`).toLocaleDateString()}
              {b.start_time && b.end_time ? ` · ${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}` : " · full day"}
              {b.reason ? ` · ${b.reason}` : ""}
            </span>
            <button className="btn-danger-text" onClick={() => handleRemove(b.id)}>
              Remove
            </button>
          </div>
        ))}
        {blocks.length === 0 && <p className="mt-2 text-sm text-muted">No blocked dates.</p>}
      </div>
    </div>
  );
}

export function PaymentInfoForm({
  staffId,
  venmo,
  cashapp,
  zelle,
  applecash,
}: {
  staffId: string;
  venmo: string | null;
  cashapp: string | null;
  zelle: string | null;
  applecash: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [values, setValues] = useState({
    venmo_handle: venmo ?? "",
    cashapp_handle: cashapp ?? "",
    zelle_handle: zelle ?? "",
    applecash_handle: applecash ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase
      .from("staff")
      .update({
        venmo_handle: values.venmo_handle || null,
        cashapp_handle: values.cashapp_handle || null,
        zelle_handle: values.zelle_handle || null,
        applecash_handle: values.applecash_handle || null,
      })
      .eq("id", staffId);
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(["venmo_handle", "cashapp_handle", "zelle_handle", "applecash_handle"] as const).map((key) => (
        <label key={key} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted capitalize">{key.replace("_handle", "").replace("applecash", "Apple Cash")}</span>
          <input
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            className="input"
            placeholder="@handle"
          />
        </label>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving…" : saved ? "Saved ✓" : "Save payment info"}
        </button>
      </div>
      <p className="text-xs text-muted sm:col-span-2">
        Shown to members when they book a private lesson with you — for direct P2P payment, not processed by LeverCRM.
      </p>
    </form>
  );
}
