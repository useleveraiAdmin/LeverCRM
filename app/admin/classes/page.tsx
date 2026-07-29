import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { CreateClassForm, DeleteClassButton } from "./classes-client";

export default async function ClassesPage() {
  const context = await getAdminContext();
  const supabase = await createClient();
  const canManage = context.role === "owner" || context.role === "manager";

  const [{ data: classes }, { data: instructors }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, description, start_at, capacity, waitlist_enabled, instructor_staff_id")
      .gte("start_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_at", { ascending: true }),
    supabase.from("staff").select("id, full_name"),
  ]);

  const classIds = (classes ?? []).map((c) => c.id);
  const { data: bookingCounts } = classIds.length
    ? await supabase
        .from("class_bookings")
        .select("class_id, status")
        .in("class_id", classIds)
    : { data: [] as { class_id: string; status: string }[] };

  const bookedByClass = new Map<string, number>();
  const waitlistedByClass = new Map<string, number>();
  for (const b of bookingCounts ?? []) {
    if (b.status === "booked") bookedByClass.set(b.class_id, (bookedByClass.get(b.class_id) ?? 0) + 1);
    if (b.status === "waitlisted")
      waitlistedByClass.set(b.class_id, (waitlistedByClass.get(b.class_id) ?? 0) + 1);
  }

  const instructorNames = new Map((instructors ?? []).map((i) => [i.id, i.full_name]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Classes</h1>
      <p className="mt-1 text-muted">Schedule, capacity, and waitlists.</p>

      {canManage && (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <CreateClassForm instructors={instructors ?? []} canManage={canManage} gymId={context.gymId} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {(classes ?? []).map((c) => {
          const booked = bookedByClass.get(c.id) ?? 0;
          const waitlisted = waitlistedByClass.get(c.id) ?? 0;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted">
                  {new Date(c.start_at).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {c.instructor_staff_id && ` · ${instructorNames.get(c.instructor_staff_id) ?? ""}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted">
                  {booked}/{c.capacity} booked
                  {c.waitlist_enabled && waitlisted > 0 && ` · ${waitlisted} waitlisted`}
                </span>
                <DeleteClassButton classId={c.id} canManage={canManage} />
              </div>
            </div>
          );
        })}
        {(classes ?? []).length === 0 && (
          <p className="text-sm text-muted">No classes scheduled yet.</p>
        )}
      </div>
    </div>
  );
}
