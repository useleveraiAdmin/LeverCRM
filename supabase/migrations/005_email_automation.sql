-- Premium+ email automations: per-gym toggles + a send log used purely for dedupe.

create table public.email_automation_settings (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  birthday_enabled boolean not null default true,
  reengagement_enabled boolean not null default true,
  class_reminder_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null check (type in ('birthday', 'reengagement', 'class_reminder')),
  related_id uuid,
  sent_at timestamptz not null default now()
);
create index email_log_member_type_idx on public.email_log(member_id, type, sent_at);
create index email_log_related_id_idx on public.email_log(related_id);

alter table public.email_automation_settings enable row level security;
alter table public.email_log enable row level security;

-- Settings are account-level config: owner-only, gated on the email_automation flag.
create policy "email_settings_select_owner" on public.email_automation_settings
  for select using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'email_automation')
    and public.current_staff_role() = 'owner'
  );
create policy "email_settings_upsert_owner" on public.email_automation_settings
  for insert with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'email_automation')
    and public.current_staff_role() = 'owner'
  );
create policy "email_settings_update_owner" on public.email_automation_settings
  for update using (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'email_automation')
    and public.current_staff_role() = 'owner'
  )
  with check (
    gym_id = public.current_gym_id()
    and public.gym_has_feature(gym_id, 'email_automation')
    and public.current_staff_role() = 'owner'
  );

-- email_log has no policies: it is only ever read/written by the cron Edge
-- Function using the service-role key, which bypasses RLS entirely. No
-- client role (owner included) needs direct access to this table.
