import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { EmailAutomationSettingsForm } from "./email-automations-client";

export default async function EmailAutomationsPage() {
  const context = await getAdminContext();
  if (context.role !== "owner") redirect("/admin/dashboard");
  if (!context.tierFlags.email_automation) redirect("/admin/billing");

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("email_automation_settings")
    .select("birthday_enabled, reengagement_enabled, class_reminder_enabled, sms_enabled")
    .eq("gym_id", context.gymId)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Email automations</h1>
      <p className="mt-1 text-muted">
        Automatic emails sent to members on your behalf — birthdays, re-engagement, and class
        reminders.
      </p>

      <div className="card mt-8 max-w-md">
        <EmailAutomationSettingsForm
          gymId={context.gymId}
          initialBirthday={settings?.birthday_enabled ?? true}
          initialReengagement={settings?.reengagement_enabled ?? true}
          initialClassReminder={settings?.class_reminder_enabled ?? true}
          initialSms={settings?.sms_enabled ?? false}
        />
      </div>
    </div>
  );
}
