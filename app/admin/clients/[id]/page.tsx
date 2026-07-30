import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { ProfileEditForm, NotesSection, DocumentsSection } from "./client-detail-client";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getAdminContext();
  const canManage = context.role === "owner" || context.role === "manager";
  const supabase = await createClient();

  const [
    { data: member },
    { data: levels },
    { data: otherMembers },
    { data: notes },
    { data: documents },
    { data: stats },
    { data: appointments },
  ] = await Promise.all([
    supabase.from("members").select("*").eq("id", id).maybeSingle(),
    supabase.from("gym_levels").select("id, name").order("sort_order"),
    supabase.from("members").select("id, full_name").neq("id", id).order("full_name"),
    supabase.from("notes").select("id, body, pinned, created_at, author_staff_id").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("member_documents").select("id, type, title, signed_at, signature_data_url").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("member_checkin_stats").select("lifetime_count, monthly_count").eq("member_id", id).maybeSingle(),
    supabase
      .from("appointments")
      .select("id, start_at, status, staff(full_name)")
      .eq("member_id", id)
      .order("start_at", { ascending: false })
      .limit(10),
  ]);

  if (!member) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">{member.full_name}</h1>
      <p className="mt-1 text-muted">{member.email}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:max-w-xs">
        <div className="stat-tile">
          <p className="n">{stats?.lifetime_count ?? 0}</p>
          <p className="l">Lifetime check-ins</p>
        </div>
        <div className="stat-tile">
          <p className="n">{stats?.monthly_count ?? 0}</p>
          <p className="l">This month</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4">
          <ProfileEditForm
            memberId={member.id}
            canManage={canManage}
            fullName={member.full_name}
            phone={member.phone}
            dateOfBirth={member.date_of_birth}
            levelId={member.level_id}
            parentMemberId={member.parent_member_id}
            levels={levels ?? []}
            otherMembers={otherMembers ?? []}
          />
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="mt-4">
          <DocumentsSection gymId={context.gymId} memberId={member.id} documents={documents ?? []} canManage={canManage} />
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Notes</h2>
        <div className="mt-4">
          <NotesSection gymId={context.gymId} memberId={member.id} notes={notes ?? []} staffId={context.staffId} />
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Appointment history</h2>
        <div className="mt-4 flex flex-col gap-2">
          {(appointments ?? []).map((a) => {
            const instructor = a.staff as unknown as { full_name: string } | null;
            return (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span>with {instructor?.full_name ?? "Unknown"}</span>
                <span className="text-muted">
                  {new Date(a.start_at).toLocaleDateString()} · {a.status}
                </span>
              </div>
            );
          })}
          {(appointments ?? []).length === 0 && <p className="text-sm text-muted">No appointments yet.</p>}
        </div>
      </div>
    </div>
  );
}
