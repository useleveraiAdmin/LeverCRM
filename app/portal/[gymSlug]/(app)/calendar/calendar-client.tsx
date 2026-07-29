"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
