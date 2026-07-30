"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type StaffRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

const ROLES = ["owner", "manager", "front_desk"] as const;

export function StaffTable({ staff, currentUserId }: { staff: StaffRow[]; currentUserId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateRole(id: string, role: string) {
    setBusyId(id);
    await supabase.from("staff").update({ role }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function removeStaff(id: string) {
    if (!confirm("Remove this staff member's access?")) return;
    setBusyId(id);
    await supabase.from("staff").delete().eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted">
          <th className="py-2 font-medium">Name</th>
          <th className="py-2 font-medium">Email</th>
          <th className="py-2 font-medium">Role</th>
          <th className="py-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {staff.map((s) => (
          <tr key={s.id} className="border-b border-border/50">
            <td className="py-3">{s.full_name}</td>
            <td className="py-3 text-muted">{s.email}</td>
            <td className="py-3">
              <select
                value={s.role}
                disabled={busyId === s.id || s.id === currentUserId}
                onChange={(e) => updateRole(s.id, e.target.value)}
                className="input w-auto"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </td>
            <td className="py-3 text-right">
              {s.id !== currentUserId && (
                <button
                  onClick={() => removeStaff(s.id)}
                  disabled={busyId === s.id}
                  className="text-xs font-medium text-red-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function InviteStaffForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("front_desk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/admin/invite-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, role }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail("");
    setFullName("");
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Invite staff member
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Full name</span>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input w-48"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input w-56"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Role</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="input w-auto"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "Sending invite…" : "Invite staff"}
      </button>
      <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
        Cancel
      </button>
      {error && <p className="w-full text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      {success && <p className="w-full text-sm" style={{ color: "var(--success)" }}>Invite sent.</p>}
    </form>
  );
}
