"use client";

import { useState } from "react";
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
