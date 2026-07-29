import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { CreateAppointmentForm, CancelAppointmentButton } from "./appointments-client";

export default async function AppointmentsPage() {
  const context = await getAdminContext();
  if (!context.tierFlags.private_lessons) redirect("/admin/billing");
  if (context.role === "front_desk") redirect("/admin/dashboard");

  const supabase = await createClient();
  const [{ data: appointments }, { data: members }, { data: staff }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_at, end_at, status, members(full_name), staff(full_name)")
      .neq("status", "cancelled")
      .gte("start_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_at", { ascending: true }),
    supabase.from("members").select("id, full_name"),
    supabase.from("staff").select("id, full_name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Private lesson appointments</h1>
      <p className="mt-1 text-muted">Book and manage 1-on-1 sessions.</p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <CreateAppointmentForm gymId={context.gymId} members={members ?? []} instructors={staff ?? []} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(appointments ?? []).map((a) => {
          const member = a.members as unknown as { full_name: string } | null;
          const instructor = a.staff as unknown as { full_name: string } | null;
          return (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium">
                  {member?.full_name ?? "Unknown"} with {instructor?.full_name ?? "Unknown"}
                </p>
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
        {(appointments ?? []).length === 0 && (
          <p className="text-sm text-muted">No upcoming appointments.</p>
        )}
      </div>
    </div>
  );
}
