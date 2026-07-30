import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";

export default async function MarketingPage() {
  const context = await getAdminContext();
  if (context.role !== "owner") redirect("/admin/dashboard");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--surface-2)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
          <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1.5-5H10l8 4V5l-8 4H5a2 2 0 0 0-2 2Z" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold">Marketing tools coming soon</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Campaigns, member referrals, and promotional templates will live here in a future update.
      </p>
    </div>
  );
}
