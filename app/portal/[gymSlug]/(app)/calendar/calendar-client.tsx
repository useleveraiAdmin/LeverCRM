"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AttendeeList({ classId }: { classId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendees, setAttendees] = useState<{ member_id: string; full_name: string }[] | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (attendees === null) {
      setLoading(true);
      const { data } = await supabase.rpc("get_class_attendees", { p_class_id: classId });
      setAttendees(data ?? []);
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button className="text-xs font-medium" style={{ color: "var(--gym-primary)" }} onClick={toggle}>
        {open ? "Hide who's going" : "Who's going?"}
      </button>
      {open && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {loading && <span className="text-xs text-muted">Loading…</span>}
          {!loading && attendees?.length === 0 && <span className="text-xs text-muted">Be the first!</span>}
          {!loading &&
            attendees?.map((a) => (
              <span
                key={a.member_id}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{ background: "var(--gym-primary)", color: "#06202b" }}
                title={a.full_name}
              >
                {a.full_name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

export function ShareClassButton({ className, gymSlug }: { className: string; gymSlug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/portal/${gymSlug}/calendar`;
    const text = `Join me at ${className}!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: className, text, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button className="text-xs font-medium text-muted" onClick={handleShare}>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

export function BookButton({
  classId,
  gymId,
  memberId,
}: {
  classId: string;
  gymId: string;
  memberId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBook() {
    setLoading(true);
    setError(null);
    const { error: bookError } = await supabase.from("class_bookings").insert({
      class_id: classId,
      gym_id: gymId,
      member_id: memberId,
    });
    setLoading(false);
    if (bookError) {
      setError(bookError.message.includes("class is full") ? "Class is full." : bookError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleBook}
        disabled={loading}
        className="rounded-lg bg-gym-primary px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Booking…" : "Book"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    await supabase.from("class_bookings").update({ status: "cancelled" }).eq("id", bookingId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-2 disabled:opacity-50"
    >
      {loading ? "Cancelling…" : "Cancel"}
    </button>
  );
}
