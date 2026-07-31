"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminPinSection({ hasPin }: { hasPin: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("set_admin_pin", { p_pin: pin });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setPin("");
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">{hasPin ? "Change PIN (4-8 digits)" : "Set a PIN (4-8 digits)"}</span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          maxLength={8}
          className="input w-32"
          placeholder="1234"
        />
      </label>
      <button type="submit" disabled={loading || pin.length < 4} className="btn btn-primary">
        {loading ? "Saving…" : saved ? "Saved ✓" : "Save PIN"}
      </button>
      {error && <p className="w-full text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <p className="w-full text-xs text-muted">
        {hasPin ? "A PIN is currently set." : "No PIN set yet."} Used as an extra confirmation step for
        Insights/Settings on a shared front-desk device.
      </p>
    </form>
  );
}

type Level = { id: string; name: string; sort_order: number };

export function LevelsSection({ gymId, levels }: { gymId: string; levels: Level[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await supabase.from("gym_levels").insert({ gym_id: gymId, name, sort_order: levels.length });
    setName("");
    setLoading(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    await supabase.from("gym_levels").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Beginner, Intermediate…" className="input" />
        <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
          Add
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {levels.map((l) => (
          <span key={l.id} className="badge badge-neutral flex items-center gap-2">
            {l.name}
            <button onClick={() => handleRemove(l.id)} style={{ color: "var(--danger)" }}>
              ×
            </button>
          </span>
        ))}
        {levels.length === 0 && <p className="text-sm text-muted">No levels defined yet.</p>}
      </div>
    </div>
  );
}

async function sha256Hex(buffer: ArrayBuffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function WaiverUploadForm({
  gymId,
  staffId,
  activeWaiverId,
  nextVersion,
}: {
  gymId: string;
  staffId: string;
  activeWaiverId: string | null;
  nextVersion: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("Liability waiver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a PDF to upload.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Waivers must be uploaded as a PDF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("PDF must be under 20MB.");
      return;
    }

    setLoading(true);
    setError(null);

    const bytes = await file.arrayBuffer();
    const fileHash = await sha256Hex(bytes);
    const waiverId = crypto.randomUUID();
    const path = `${gymId}/${waiverId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("waiver-templates")
      .upload(path, file, { contentType: "application/pdf" });
    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }

    // Only one waiver can be active per gym (enforced by a unique index) —
    // deactivate the current one first so the new insert doesn't collide.
    if (activeWaiverId) {
      await supabase.from("waivers").update({ is_active: false }).eq("id", activeWaiverId);
    }

    const { error: insertError } = await supabase.from("waivers").insert({
      id: waiverId,
      gym_id: gymId,
      title,
      version: nextVersion,
      storage_path: path,
      file_hash: fileHash,
      is_active: true,
      created_by: staffId,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Waiver title</span>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">PDF document</span>
        <input ref={inputRef} type="file" accept="application/pdf" className="input" />
      </label>
      <p className="text-xs text-muted">
        {activeWaiverId
          ? "Uploading a new PDF replaces the current version. Members who already signed the old version stay on file — new signers see this one."
          : "Members will review and sign this PDF in-app. Existing signed waivers (uploaded or paper) aren't affected by this."}
      </p>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn btn-primary w-fit">
        {loading ? "Uploading…" : activeWaiverId ? "Publish new version" : "Publish waiver"}
      </button>
    </form>
  );
}
