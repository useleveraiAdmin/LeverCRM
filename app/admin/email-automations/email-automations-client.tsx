"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Settings = {
  birthday_enabled: boolean;
  reengagement_enabled: boolean;
  class_reminder_enabled: boolean;
  sms_enabled: boolean;
};

export function EmailAutomationSettingsForm({
  gymId,
  initialBirthday,
  initialReengagement,
  initialClassReminder,
  initialSms,
}: {
  gymId: string;
  initialBirthday: boolean;
  initialReengagement: boolean;
  initialClassReminder: boolean;
  initialSms: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings>({
    birthday_enabled: initialBirthday,
    reengagement_enabled: initialReengagement,
    class_reminder_enabled: initialClassReminder,
    sms_enabled: initialSms,
  });
  const [savingKey, setSavingKey] = useState<keyof Settings | null>(null);

  async function handleToggle(key: keyof Settings, value: boolean) {
    setSavingKey(key);
    const next = { ...settings, [key]: value };
    setSettings(next);
    await supabase.from("email_automation_settings").upsert({ gym_id: gymId, ...next });
    setSavingKey(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Toggle
        label="Birthday emails"
        checked={settings.birthday_enabled}
        saving={savingKey === "birthday_enabled"}
        onChange={(v) => handleToggle("birthday_enabled", v)}
      />
      <Toggle
        label="Re-engagement emails (45 days inactive)"
        checked={settings.reengagement_enabled}
        saving={savingKey === "reengagement_enabled"}
        onChange={(v) => handleToggle("reengagement_enabled", v)}
      />
      <Toggle
        label="Class reminder emails"
        checked={settings.class_reminder_enabled}
        saving={savingKey === "class_reminder_enabled"}
        onChange={(v) => handleToggle("class_reminder_enabled", v)}
      />
      <div>
        <Toggle
          label="Also send SMS for the above"
          checked={settings.sms_enabled}
          saving={savingKey === "sms_enabled"}
          onChange={(v) => handleToggle("sms_enabled", v)}
        />
        <p className="mt-1.5 text-xs text-muted">
          SMS delivery isn&apos;t connected yet — this saves your preference now so texts go out
          automatically once a provider is configured.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  saving,
  onChange,
}: {
  label: string;
  checked: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {saving && <span className="text-xs text-muted">Saving…</span>}
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </div>
    </label>
  );
}
