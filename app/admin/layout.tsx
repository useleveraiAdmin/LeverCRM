import { getAdminContext } from "@/lib/admin/context";
import { AdminNav } from "./admin-nav";
import { AdminTopbar } from "./admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getAdminContext();

  return (
    <div
      className="admin-shell flex flex-1"
      style={
        {
          "--gym-primary": context.branding.primaryColor || undefined,
          "--gym-secondary": context.branding.secondaryColor || undefined,
          background: "var(--background)",
        } as React.CSSProperties
      }
    >
      <AdminNav context={context} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar fullName={context.fullName} role={context.role} staffId={context.staffId} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
