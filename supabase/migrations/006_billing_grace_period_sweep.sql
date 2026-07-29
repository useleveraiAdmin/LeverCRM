-- Daily sweep: gyms whose grace period has expired revert to Base tier flags.
-- Runs as the cron job owner (postgres), which bypasses RLS by table ownership.

create or replace function public.sweep_expired_grace_periods()
returns void
language sql
security definer
set search_path = public
as $$
  update public.gyms
  set
    tier_flags = '{"private_lessons": false, "gym_shop": false, "email_automation": false, "wearables": false}'::jsonb,
    subscription_status = 'canceled',
    grace_period_ends_at = null
  where subscription_status = 'past_due'
    and grace_period_ends_at is not null
    and grace_period_ends_at < now();
$$;

select cron.schedule(
  'sweep-expired-grace-periods',
  '17 3 * * *',
  $$select public.sweep_expired_grace_periods();$$
);
