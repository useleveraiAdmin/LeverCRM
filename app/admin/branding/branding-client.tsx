"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/image-upload";

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
  const [editing, setEditing] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [primary, setPrimary] = useState(initialPrimary ?? "#14b8a6");
  const [secondary, setSecondary] = useState(initialSecondary ?? "#ccfbf1");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase
      .from("gym_branding")
      .update({ logo_url: logoUrl || null, primary_color: primary, secondary_color: secondary })
      .eq("gym_id", gymId);

    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setLogoUrl(initialLogoUrl ?? "");
    setPrimary(initialPrimary ?? "#14b8a6");
    setSecondary(initialSecondary ?? "#ccfbf1");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded-lg border object-cover" style={{ borderColor: "var(--border)" }} />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-lg text-xs text-muted"
            style={{ background: "var(--surface-2)" }}
          >
            No logo
          </div>
        )}
        <div className="flex gap-6">
          <ColorSwatch label="Primary color" color={primary} />
          <ColorSwatch label="Secondary color" color={secondary} />
        </div>
        <button className="btn btn-outline w-fit" onClick={() => setEditing(true)}>
          Edit branding
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Logo</span>
        <ImageUpload gymId={gymId} folder="branding" currentUrl={logoUrl || null} onUploaded={setLogoUrl} />
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
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving…" : "Save branding"}
        </button>
        <button type="button" className="btn btn-outline" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-6 w-6 rounded border" style={{ background: color, borderColor: "var(--border)" }} />
        <span className="text-sm">{color}</span>
      </div>
    </div>
  );
}
