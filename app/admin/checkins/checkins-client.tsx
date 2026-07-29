"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; full_name: string; email: string };
type Stats = { lifetime_count: number | null; monthly_count: number | null };

export function CheckinSearch({ staffId, gymId }: { staffId: string; gymId: string }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsByMember, setStatsByMember] = useState<Record<string, Stats>>({});
  const [justCheckedIn, setJustCheckedIn] = useState<string | null>(null);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("members")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);
    setResults(data ?? []);
    setLoading(false);
  }

  async function loadStats(memberId: string) {
    const { data } = await supabase
      .from("member_checkin_stats")
      .select("lifetime_count, monthly_count")
      .eq("member_id", memberId)
      .maybeSingle();
    setStatsByMember((prev) => ({
      ...prev,
      [memberId]: data ?? { lifetime_count: 0, monthly_count: 0 },
    }));
  }

  async function checkIn(memberId: string) {
    setJustCheckedIn(null);
    const { error } = await supabase.from("checkins").insert({
      member_id: memberId,
      checked_in_by: staffId,
      gym_id: gymId,
    });
    if (!error) {
      setJustCheckedIn(memberId);
      loadStats(memberId);
    }
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search members by name or email…"
        className="input"
      />
      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="text-sm text-muted">Searching…</p>}
        {results.map((m) => {
          const stats = statsByMember[m.id];
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{m.full_name}</p>
                <p className="text-sm text-muted">{m.email}</p>
                {stats && (
                  <p className="mt-1 text-xs text-muted">
                    {stats.lifetime_count ?? 0} lifetime · {stats.monthly_count ?? 0} this month
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {justCheckedIn === m.id && (
                  <span className="text-xs font-medium text-emerald-400">Checked in ✓</span>
                )}
                <button
                  onClick={() => checkIn(m.id)}
                  className="rounded-lg bg-gym-primary px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Check in
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
