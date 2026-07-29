import { getAdminContext } from "@/lib/admin/context";
import { CheckinSearch } from "./checkins-client";

export default async function CheckinsPage() {
  const context = await getAdminContext();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Check-in</h1>
      <p className="mt-1 text-muted">Find a member and check them in.</p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <CheckinSearch staffId={context.staffId} gymId={context.gymId} />
      </div>
    </div>
  );
}
