import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";
import { BookButton, CancelBookingButton, AttendeeList, ShareClassButton } from "./calendar-client";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  const supabase = await createClient();

  const [{ data: classes }, { data: myBookings }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, description, start_at, capacity, waitlist_enabled")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
    supabase
      .from("class_bookings")
      .select("id, class_id, status, waitlist_position")
      .eq("member_id", context.memberId)
      .neq("status", "cancelled"),
  ]);

  const classIds = (classes ?? []).map((c) => c.id);
  const { data: allBookings } = classIds.length
    ? await supabase.from("class_bookings").select("class_id, status").in("class_id", classIds)
    : { data: [] as { class_id: string; status: string }[] };

  const bookedCount = new Map<string, number>();
  for (const b of allBookings ?? []) {
    if (b.status === "booked") bookedCount.set(b.class_id, (bookedCount.get(b.class_id) ?? 0) + 1);
  }
  const myBookingByClass = new Map((myBookings ?? []).map((b) => [b.class_id, b]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Classes</h1>
      <p className="mt-1 text-muted">Book your next session at {context.gymName}.</p>

      <div className="mt-8 flex flex-col gap-3">
        {(classes ?? []).map((c) => {
          const booked = bookedCount.get(c.id) ?? 0;
          const mine = myBookingByClass.get(c.id);
          const isFull = booked >= c.capacity;

          return (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between">
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
                    {" · "}
                    {booked}/{c.capacity} booked
                  </p>
                  {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
                </div>

                {mine ? (
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        mine.status === "booked" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {mine.status === "booked" ? "Booked" : `Waitlisted (#${mine.waitlist_position})`}
                    </span>
                    <CancelBookingButton bookingId={mine.id} />
                  </div>
                ) : isFull && !c.waitlist_enabled ? (
                  <span className="text-sm text-muted">Full</span>
                ) : (
                  <BookButton classId={c.id} gymId={context.gymId} memberId={context.memberId} />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <AttendeeList classId={c.id} />
                <ShareClassButton className={c.name} gymSlug={gymSlug} />
              </div>
            </div>
          );
        })}
        {(classes ?? []).length === 0 && (
          <p className="text-sm text-muted">No upcoming classes scheduled.</p>
        )}
      </div>
    </div>
  );
}
