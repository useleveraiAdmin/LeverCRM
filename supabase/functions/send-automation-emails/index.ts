import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = Deno.env.get("AUTOMATION_FROM_ADDRESS") ?? "LeverCRM <notifications@levercrm.net>";
const REENGAGEMENT_DAYS = 45;

type Member = { id: string; gym_id: string; email: string; full_name: string };

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[send-automation-emails] RESEND_API_KEY unset — skipping send to ${to}: ${subject}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });
}

async function gymsWithFeature(): Promise<Set<string>> {
  const { data } = await supabase.from("gyms").select("id, tier_flags");
  const ids = (data ?? [])
    .filter((g) => (g.tier_flags as { email_automation?: boolean })?.email_automation)
    .map((g) => g.id as string);
  return new Set(ids);
}

async function alreadySent(memberId: string, type: string, sinceIso: string, relatedId?: string) {
  let query = supabase
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("type", type)
    .gte("sent_at", sinceIso);
  if (relatedId) query = query.eq("related_id", relatedId);
  const { count } = await query;
  return (count ?? 0) > 0;
}

async function runBirthdays(enabledGyms: Set<string>) {
  const today = new Date();
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1)).toISOString();

  const { data: members } = await supabase
    .from("members")
    .select("id, gym_id, email, full_name, date_of_birth")
    .not("date_of_birth", "is", null);

  for (const m of (members ?? []) as (Member & { date_of_birth: string })[]) {
    if (!enabledGyms.has(m.gym_id)) continue;
    const dob = new Date(m.date_of_birth);
    if (dob.getUTCMonth() + 1 !== month || dob.getUTCDate() !== day) continue;

    const { data: settings } = await supabase
      .from("email_automation_settings")
      .select("birthday_enabled")
      .eq("gym_id", m.gym_id)
      .maybeSingle();
    if (settings && settings.birthday_enabled === false) continue;

    if (await alreadySent(m.id, "birthday", yearStart)) continue;

    await sendEmail(m.email, "Happy birthday from your gym! 🎉", `<p>Happy birthday, ${m.full_name}!</p>`);
    await supabase.from("email_log").insert({ gym_id: m.gym_id, member_id: m.id, type: "birthday" });
  }
}

async function runReengagement(enabledGyms: Set<string>) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REENGAGEMENT_DAYS);
  const cutoffIso = cutoff.toISOString();
  const windowStart = cutoff.toISOString();

  const { data: members } = await supabase.from("members").select("id, gym_id, email, full_name, created_at");

  for (const m of (members ?? []) as (Member & { created_at: string })[]) {
    if (!enabledGyms.has(m.gym_id)) continue;

    const { data: settings } = await supabase
      .from("email_automation_settings")
      .select("reengagement_enabled")
      .eq("gym_id", m.gym_id)
      .maybeSingle();
    if (settings && settings.reengagement_enabled === false) continue;

    const { data: lastCheckin } = await supabase
      .from("checkins")
      .select("checked_in_at")
      .eq("member_id", m.id)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastActivity = lastCheckin?.checked_in_at ?? m.created_at;
    if (new Date(lastActivity) > cutoff) continue;

    if (await alreadySent(m.id, "reengagement", windowStart)) continue;

    await sendEmail(
      m.email,
      "We miss you at the gym!",
      `<p>Hi ${m.full_name}, it's been a while since your last visit — come back soon!</p>`
    );
    await supabase.from("email_log").insert({ gym_id: m.gym_id, member_id: m.id, type: "reengagement" });
  }

  void cutoffIso;
}

async function runClassReminders(enabledGyms: Set<string>) {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("class_bookings")
    .select("id, gym_id, member_id, members(email, full_name), classes(name, start_at)")
    .eq("status", "booked")
    .gte("classes.start_at", windowStart)
    .lte("classes.start_at", windowEnd);

  for (const b of bookings ?? []) {
    if (!enabledGyms.has(b.gym_id)) continue;

    const { data: settings } = await supabase
      .from("email_automation_settings")
      .select("class_reminder_enabled")
      .eq("gym_id", b.gym_id)
      .maybeSingle();
    if (settings && settings.class_reminder_enabled === false) continue;

    if (await alreadySent(b.member_id, "class_reminder", "1970-01-01", b.id)) continue;

    const member = b.members as unknown as { email: string; full_name: string } | null;
    const cls = b.classes as unknown as { name: string; start_at: string } | null;
    if (!member || !cls) continue;

    await sendEmail(
      member.email,
      `Reminder: ${cls.name} is coming up`,
      `<p>Hi ${member.full_name}, this is a reminder that you're booked for ${cls.name} at ${new Date(
        cls.start_at
      ).toLocaleString()}.</p>`
    );
    await supabase
      .from("email_log")
      .insert({ gym_id: b.gym_id, member_id: b.member_id, type: "class_reminder", related_id: b.id });
  }
}

Deno.serve(async () => {
  const enabledGyms = await gymsWithFeature();
  await runBirthdays(enabledGyms);
  await runReengagement(enabledGyms);
  await runClassReminders(enabledGyms);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
