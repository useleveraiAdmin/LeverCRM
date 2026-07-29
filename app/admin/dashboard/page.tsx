import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export default async function DashboardPage() {
  const context = await getAdminContext();
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [{ count: memberCount }, { count: todayCheckins }, { data: upcomingClasses }] =
    await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .gte("checked_in_at", startOfDay.toISOString())
        .lte("checked_in_at", endOfDay.toISOString()),
      supabase
        .from("classes")
        .select("id, name, start_at, capacity")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back, {context.fullName.split(" ")[0]}</h1>
      <p className="mt-1 text-muted">{context.gymName}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={memberCount ?? 0} />
        <StatCard label="Check-ins today" value={todayCheckins ?? 0} />
        <StatCard label="Upcoming classes" value={upcomingClasses?.length ?? 0} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Next up</h2>
        <div className="mt-4 flex flex-col gap-2">
          {upcomingClasses && upcomingClasses.length > 0 ? (
            upcomingClasses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-muted">
                  {new Date(c.start_at).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No upcoming classes scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
