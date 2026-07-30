import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext, type AdminContext } from "@/lib/admin/context";
import { CreateAppointmentForm, CancelAppointmentButton } from "./appointments-client";
import { WeeklyAvailability, BlockedDates, PaymentInfoForm } from "./availability-client";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "availability", label: "My Availability" },
  { key: "payment", label: "Payment Info" },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab ?? "upcoming";
  const context = await getAdminContext();
  if (!context.tierFlags.private_lessons) redirect("/admin/billing");
  if (context.role === "front_desk") redirect("/admin/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Private lesson appointments</h1>
      <p className="mt-1 text-muted">Book and manage 1-on-1 sessions.</p>

      <div className="mt-6 flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/appointments?tab=${t.key}`}
            className="px-3 py-2 text-sm font-medium"
            style={
              activeTab === t.key
                ? { color: "var(--gym-primary)", borderBottom: "2px solid var(--gym-primary)" }
                : { color: "var(--muted)" }
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "upcoming" && <UpcomingTab context={context} />}
      {activeTab === "availability" && <AvailabilityTab gymId={context.gymId} staffId={context.staffId} />}
      {activeTab === "payment" && <PaymentTab staffId={context.staffId} />}
    </div>
  );
}

async function UpcomingTab({ context }: { context: AdminContext }) {
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
    <>
      <div className="card mt-6">
        <CreateAppointmentForm gymId={context.gymId} members={members ?? []} instructors={staff ?? []} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(appointments ?? []).map((a) => {
          const member = a.members as unknown as { full_name: string } | null;
          const instructor = a.staff as unknown as { full_name: string } | null;
          return (
            <div key={a.id} className="card flex items-center justify-between">
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
        {(appointments ?? []).length === 0 && <p className="text-sm text-muted">No upcoming appointments.</p>}
      </div>
    </>
  );
}

async function AvailabilityTab({ gymId, staffId }: { gymId: string; staffId: string }) {
  const supabase = await createClient();
  const [{ data: availability }, { data: blocks }] = await Promise.all([
    supabase.from("instructor_availability").select("id, day_of_week, start_time, end_time").eq("staff_id", staffId),
    supabase.from("instructor_blocks").select("id, date, start_time, end_time, reason").eq("staff_id", staffId).order("date"),
  ]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Weekly availability</h2>
        <div className="mt-4">
          <WeeklyAvailability gymId={gymId} staffId={staffId} rows={availability ?? []} />
        </div>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold">Blocked dates</h2>
        <div className="mt-4">
          <BlockedDates gymId={gymId} staffId={staffId} blocks={blocks ?? []} />
        </div>
      </div>
    </div>
  );
}

async function PaymentTab({ staffId }: { staffId: string }) {
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("staff")
    .select("venmo_handle, cashapp_handle, zelle_handle, applecash_handle")
    .eq("id", staffId)
    .maybeSingle();

  return (
    <div className="card mt-6">
      <PaymentInfoForm
        staffId={staffId}
        venmo={me?.venmo_handle ?? null}
        cashapp={me?.cashapp_handle ?? null}
        zelle={me?.zelle_handle ?? null}
        applecash={me?.applecash_handle ?? null}
      />
    </div>
  );
}
