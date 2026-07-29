import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";

export default async function MemberCheckinsPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  const supabase = await createClient();

  const [{ data: stats }, { data: history }] = await Promise.all([
    supabase
      .from("member_checkin_stats")
      .select("lifetime_count, monthly_count")
      .eq("member_id", context.memberId)
      .maybeSingle(),
    supabase
      .from("checkins")
      .select("id, checked_in_at")
      .eq("member_id", context.memberId)
      .order("checked_in_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Check-ins</h1>
      <p className="mt-1 text-muted">Your attendance at {context.gymName}.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Lifetime</p>
          <p className="mt-2 text-3xl font-semibold">{stats?.lifetime_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">This month</p>
          <p className="mt-2 text-3xl font-semibold">{stats?.monthly_count ?? 0}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Recent check-ins</h2>
        <div className="mt-4 flex flex-col gap-2">
          {(history ?? []).map((h) => (
            <div key={h.id} className="border-b border-border/50 py-2 text-sm text-muted">
              {new Date(h.checked_in_at).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          ))}
          {(history ?? []).length === 0 && (
            <p className="text-sm text-muted">No check-ins yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
