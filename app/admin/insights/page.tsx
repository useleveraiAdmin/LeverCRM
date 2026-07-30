import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export default async function InsightsPage() {
  const context = await getAdminContext();
  const supabase = await createClient();

  const [
    { data: members },
    { data: levels },
    { count: totalCheckins },
    { data: classes },
    { data: bookings },
  ] = await Promise.all([
    supabase.from("members").select("id, level_id"),
    supabase.from("gym_levels").select("id, name"),
    supabase.from("checkins").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id, capacity, start_at").lt("start_at", new Date().toISOString()).order("start_at", { ascending: false }).limit(20),
    supabase.from("class_bookings").select("class_id").eq("status", "booked"),
  ]);

  const levelCounts = new Map<string, number>();
  (members ?? []).forEach((m) => {
    const key = m.level_id ?? "unassigned";
    levelCounts.set(key, (levelCounts.get(key) ?? 0) + 1);
  });
  const levelNameById = Object.fromEntries((levels ?? []).map((l) => [l.id, l.name]));

  const bookingCounts = new Map<string, number>();
  (bookings ?? []).forEach((b) => bookingCounts.set(b.class_id, (bookingCounts.get(b.class_id) ?? 0) + 1));
  const recentClasses = classes ?? [];
  const fillRates = recentClasses.map((c) => ({
    date: c.start_at,
    fillPct: c.capacity > 0 ? Math.round(((bookingCounts.get(c.id) ?? 0) / c.capacity) * 100) : 0,
  }));
  const avgFillRate = fillRates.length
    ? Math.round(fillRates.reduce((sum, f) => sum + f.fillPct, 0) / fillRates.length)
    : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Insights</h1>
      <p className="mt-1 text-muted">A quick read on how {context.gymName} is doing.</p>

      <div className="card mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="stat-tile">
            <p className="n">{members?.length ?? 0}</p>
            <p className="l">Total members</p>
          </div>
          <div className="stat-tile">
            <p className="n">{totalCheckins ?? 0}</p>
            <p className="l">Lifetime check-ins</p>
          </div>
          <div className="stat-tile">
            <p className="n">{avgFillRate}%</p>
            <p className="l">Avg. class fill rate</p>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Member levels</h2>
        <div className="mt-4 flex flex-col gap-2">
          {[...levelCounts.entries()].map(([levelId, count]) => (
            <div key={levelId} className="flex items-center justify-between text-sm">
              <span>{levelId === "unassigned" ? "No level set" : levelNameById[levelId] ?? "Unknown"}</span>
              <span className="text-muted">{count}</span>
            </div>
          ))}
          {levelCounts.size === 0 && <p className="text-sm text-muted">No members yet.</p>}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Recent class fill rates</h2>
        <div className="mt-4 flex flex-col gap-2">
          {fillRates.slice(0, 10).map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted">{new Date(f.date).toLocaleDateString()}</span>
              <span>{f.fillPct}%</span>
            </div>
          ))}
          {fillRates.length === 0 && <p className="text-sm text-muted">No past classes yet.</p>}
        </div>
      </div>
    </div>
  );
}
