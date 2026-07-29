alter table public.gyms add column admin_pin_hash text;

-- gyms has no client UPDATE policy at all (tier_flags/stripe fields are
-- server/webhook-only) — the PIN is owner-settable via a narrow RPC instead
-- of opening a blanket UPDATE policy on the whole row.
create or replace function public.set_admin_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_gym_id uuid;
begin
  if public.current_staff_role() is distinct from 'owner' then
    raise exception 'Only the gym owner can set the admin PIN';
  end if;
  if p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'PIN must be 4-8 digits';
  end if;
  v_gym_id := public.current_gym_id();
  update public.gyms set admin_pin_hash = crypt(p_pin, gen_salt('bf')) where id = v_gym_id;
end;
$$;

create or replace function public.verify_admin_pin(p_pin text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    (select admin_pin_hash = crypt(p_pin, admin_pin_hash) from public.gyms where id = public.current_gym_id()),
    false
  );
$$;

create or replace function public.has_admin_pin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select admin_pin_hash is not null from public.gyms where id = public.current_gym_id()), false);
$$;

revoke all on function public.set_admin_pin(text) from public;
grant execute on function public.set_admin_pin(text) to authenticated;
revoke all on function public.verify_admin_pin(text) from public;
grant execute on function public.verify_admin_pin(text) to authenticated;
revoke all on function public.has_admin_pin() from public;
grant execute on function public.has_admin_pin() to authenticated;
