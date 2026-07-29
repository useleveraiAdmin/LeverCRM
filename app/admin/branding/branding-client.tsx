"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BrandingForm({
  gymId,
  initialLogoUrl,
  initialPrimary,
  initialSecondary,
}: {
  gymId: string;
  initialLogoUrl: string | null;
  initialPrimary: string | null;
  initialSecondary: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [primary, setPrimary] = useState(initialPrimary ?? "#3fc1ff");
  const [secondary, setSecondary] = useState(initialSecondary ?? "#d9f0ff");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    await supabase
      .from("gym_branding")
      .update({ logo_url: logoUrl || null, primary_color: primary, secondary_color: secondary })
      .eq("gym_id", gymId);

    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Logo URL</span>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          className="input"
        />
      </label>
      <div className="flex gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Primary color</span>
          <input
            type="color"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-10 w-20 rounded border border-border bg-surface-2"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Secondary color</span>
          <input
            type="color"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className="h-10 w-20 rounded border border-border bg-surface-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-gym-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save branding"}
      </button>
      {saved && <p className="text-sm text-emerald-400">Saved.</p>}
    </form>
  );
}
