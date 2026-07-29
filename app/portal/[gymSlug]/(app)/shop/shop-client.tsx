"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PurchaseButton({
  productId,
  gymId,
  memberId,
  priceCents,
}: {
  productId: string;
  gymId: string;
  memberId: string;
  priceCents: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    setError(null);
    const { error: orderError } = await supabase.from("product_orders").insert({
      gym_id: gymId,
      member_id: memberId,
      product_id: productId,
      quantity: 1,
      total_cents: priceCents,
    });
    setLoading(false);
    if (orderError) {
      setError(orderError.message.includes("not enough stock") ? "Out of stock." : orderError.message);
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-xs font-medium text-emerald-400">Reserved for pickup ✓</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="rounded-lg bg-gym-primary px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Reserving…" : "Buy — pick up in gym"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
