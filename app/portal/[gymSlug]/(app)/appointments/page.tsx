import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberContext } from "@/lib/member/context";
import { BookAppointmentForm, CancelAppointmentButton } from "./appointments-client";

export default async function MemberAppointmentsPage({
  params,
}: {
  params: Promise<{ gymSlug: string }>;
}) {
  const { gymSlug } = await params;
  const context = await getMemberContext(gymSlug);
  if (!context.tierFlags.private_lessons) redirect(`/portal/${gymSlug}/calendar`);

  const supabase = await createClient();
  const [{ data: instructors }, { data: myAppointments }] = await Promise.all([
    supabase.from("staff").select("id, full_name, venmo_handle, cashapp_handle, zelle_handle, applecash_handle"),
    supabase
      .from("appointments")
      .select("id, start_at, status, staff(full_name)")
      .eq("member_id", context.memberId)
      .neq("status", "cancelled")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Private lessons</h1>
      <p className="mt-1 text-muted">Book a 1-on-1 session with an instructor.</p>

      <div className="card mt-8">
        <BookAppointmentForm
          gymId={context.gymId}
          memberId={context.memberId}
          instructors={instructors ?? []}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(myAppointments ?? []).map((a) => {
          const instructor = a.staff as unknown as { full_name: string } | null;
          return (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">with {instructor?.full_name ?? "Unknown"}</p>
                <p className="text-sm text-muted">
                  {new Date(a.start_at).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <CancelAppointmentButton appointmentId={a.id} />
            </div>
          );
        })}
        {(myAppointments ?? []).length === 0 && (
          <p className="text-sm text-muted">No upcoming appointments.</p>
        )}
      </div>
    </div>
  );
}
