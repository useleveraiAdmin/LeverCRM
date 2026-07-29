"use client";

import { useState } from "react";

const PLANS = [
  { priceId: "price_1TydNoFGKmShNS5vxS3poP29", label: "Pro", price: "$99/mo" },
  { priceId: "price_1TydNtFGKmShNS5vziKPjckX", label: "Premium", price: "$149/mo" },
  { priceId: "price_1TydNxFGKmShNS5vItUUrZ1O", label: "Premium Plus", price: "$199/mo" },
];

export function UpgradeButtons() {
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(priceId: string) {
    setLoadingPrice(priceId);
    setError(null);
    const res = await fetch("/api/billing/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      setLoadingPrice(null);
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.priceId}
            onClick={() => handleUpgrade(plan.priceId)}
            disabled={loadingPrice !== null}
            className="rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold transition hover:border-gym-primary disabled:opacity-50"
          >
            {loadingPrice === plan.priceId ? "Redirecting…" : `Upgrade to ${plan.label} — ${plan.price}`}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
