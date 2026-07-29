"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EmailAutomationSettingsForm({
  gymId,
  initialBirthday,
  initialReengagement,
  initialClassReminder,
}: {
  gymId: string;
  initialBirthday: boolean;
  initialReengagement: boolean;
  initialClassReminder: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [birthday, setBirthday] = useState(initialBirthday);
  const [reengagement, setReengagement] = useState(initialReengagement);
  const [classReminder, setClassReminder] = useState(initialClassReminder);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    await supabase.from("email_automation_settings").upsert({
      gym_id: gymId,
      birthday_enabled: birthday,
      reengagement_enabled: reengagement,
      class_reminder_enabled: classReminder,
    });

    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Toggle label="Birthday emails" checked={birthday} onChange={setBirthday} />
      <Toggle
        label="Re-engagement emails (45 days inactive)"
        checked={reengagement}
        onChange={setReengagement}
      />
      <Toggle label="Class reminder emails" checked={classReminder} onChange={setClassReminder} />
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-gym-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save"}
      </button>
      {saved && <p className="text-sm text-emerald-400">Saved.</p>}
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
