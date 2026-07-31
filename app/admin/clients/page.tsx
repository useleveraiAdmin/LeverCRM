import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { AddClientForm, ExportCsvButton } from "./clients-client";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const context = await getAdminContext();
  const canManage = context.role === "owner" || context.role === "manager";
  const supabase = await createClient();

  const { data: activeWaiverRow } = await supabase
    .from("waivers")
    .select("id, title, storage_path")
    .eq("gym_id", context.gymId)
    .eq("is_active", true)
    .maybeSingle();
  const activeWaiver = activeWaiverRow
    ? { id: activeWaiverRow.id, title: activeWaiverRow.title, storagePath: activeWaiverRow.storage_path }
    : null;

  let query = supabase
    .from("members")
    .select("id, full_name, email, phone, date_of_birth, gym_levels(name)")
    .order("full_name", { ascending: true });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data } = await query;
  const clients = (data ?? []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    date_of_birth: c.date_of_birth,
    level_name: (c.gym_levels as unknown as { name: string } | null)?.name ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="mt-1 text-muted">{clients.length} total</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton clients={clients} />
        </div>
      </div>

      <form className="mt-6 max-w-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name or email…" className="input" />
      </form>

      <div className="mt-4">
        <AddClientForm canManage={canManage} gymId={context.gymId} staffId={context.staffId} activeWaiver={activeWaiver} />
      </div>

      <div className="card mt-6">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">
                  <Link href={`/admin/clients/${c.id}`} className="hover:underline">
                    {c.full_name}
                  </Link>
                </td>
                <td className="text-muted">{c.email}</td>
                <td className="text-muted">{c.phone ?? "—"}</td>
                <td className="text-muted">{c.level_name ?? "—"}</td>
                <td className="text-right">
                  <Link href={`/admin/clients/${c.id}`} className="text-sm font-medium" style={{ color: "var(--gym-primary)" }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
