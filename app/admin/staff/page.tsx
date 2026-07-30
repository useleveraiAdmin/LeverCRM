import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { StaffTable, InviteStaffForm } from "./staff-client";

export default async function StaffPage() {
  const context = await getAdminContext();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Staff</h1>
      <p className="mt-1 text-muted">Manage who has access to {context.gymName}&apos;s admin.</p>

      <div className="mt-8">
        <InviteStaffForm />
      </div>

      <div className="card mt-6">
        <StaffTable staff={staff ?? []} currentUserId={context.userId} />
      </div>
    </div>
  );
}
