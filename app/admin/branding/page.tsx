import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";
import { BrandingForm } from "./branding-client";

export default async function BrandingPage() {
  const context = await getAdminContext();
  if (context.role !== "owner") redirect("/admin/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Branding</h1>
      <p className="mt-1 text-muted">
        Your logo and colors show up across both the staff and member apps.
      </p>

      <div className="mt-8 max-w-md rounded-xl border border-border bg-surface p-6">
        <BrandingForm
          gymId={context.gymId}
          initialLogoUrl={context.branding.logoUrl}
          initialPrimary={context.branding.primaryColor}
          initialSecondary={context.branding.secondaryColor}
        />
      </div>
    </div>
  );
}
