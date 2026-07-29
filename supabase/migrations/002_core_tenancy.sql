-- Core tenancy: gyms, branding, staff, members + signup RPCs

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tier_flags jsonb not null default '{"private_lessons": false, "gym_shop": false, "email_automation": false, "wearables": false}'::jsonb,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'none' check (subscription_status in ('none', 'active', 'past_due', 'canceled')),
  grace_period_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gym_branding (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  logo_url text,
  primary_color text,
  secondary_color text,
  updated_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'front_desk')),
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);
create index staff_gym_id_idx on public.staff(gym_id);

create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  profile_picture_url text,
  created_at timestamptz not null default now()
);
create index members_gym_id_idx on public.members(gym_id);

-- Helper functions used throughout RLS policies. SECURITY DEFINER + fixed
-- search_path so they can read staff/members regardless of the caller's own
-- row visibility, without being hijackable via search_path tricks.

create or replace function public.current_gym_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select gym_id from public.staff where id = auth.uid()),
    (select gym_id from public.members where id = auth.uid())
  );
$$;

create or replace function public.current_staff_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.staff where id = auth.uid();
$$;

create or replace function public.is_current_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.members where id = auth.uid());
$$;

alter table public.gyms enable row level security;
alter table public.gym_branding enable row level security;
alter table public.staff enable row level security;
alter table public.members enable row level security;

-- gyms: read-only to members of that tenant. Billing/tier fields are only
-- ever written by the service-role Stripe webhook, never by client roles.
create policy "gyms_select_own" on public.gyms
  for select using (id = public.current_gym_id());

-- gym_branding: any authenticated tenant member can read; only the owner can write.
create policy "branding_select_own" on public.gym_branding
  for select using (gym_id = public.current_gym_id());
create policy "branding_update_owner" on public.gym_branding
  for update using (gym_id = public.current_gym_id() and public.current_staff_role() = 'owner')
  with check (gym_id = public.current_gym_id() and public.current_staff_role() = 'owner');

-- staff: owner manages everyone in the gym; manager/front_desk can only see their own row.
create policy "staff_select" on public.staff
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() = 'owner' or id = auth.uid())
  );
create policy "staff_insert_owner" on public.staff
  for insert with check (gym_id = public.current_gym_id() and public.current_staff_role() = 'owner');
create policy "staff_update_owner" on public.staff
  for update using (gym_id = public.current_gym_id() and public.current_staff_role() = 'owner')
  with check (gym_id = public.current_gym_id() and public.current_staff_role() = 'owner');
create policy "staff_delete_owner" on public.staff
  for delete using (gym_id = public.current_gym_id() and public.current_staff_role() = 'owner');

-- members: owner/manager have full access; front_desk can look members up (read-only);
-- a member can see and edit only their own profile.
create policy "members_select" on public.members
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner', 'manager', 'front_desk') or id = auth.uid())
  );
create policy "members_insert_staff" on public.members
  for insert with check (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'));
create policy "members_update" on public.members
  for update using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner', 'manager') or id = auth.uid())
  )
  with check (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner', 'manager') or id = auth.uid())
  );
create policy "members_delete_staff" on public.members
  for delete using (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'));

-- Slug availability check usable before a session has a gym (signup form).
create or replace function public.is_gym_slug_available(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (select 1 from public.gyms where slug = p_slug);
$$;
grant execute on function public.is_gym_slug_available(text) to anon, authenticated;

-- Deferred-profile-creation signup RPCs (idempotent) — called after auth.signUp()
-- succeeds (and, since email confirmation is on, safe to call again on first login).
create or replace function public.complete_gym_owner_signup(p_gym_name text, p_gym_slug text, p_owner_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_gym_id uuid;
  v_email text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select gym_id into v_gym_id from public.staff where id = v_uid;
  if v_gym_id is not null then
    return v_gym_id;
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.gyms (name, slug) values (p_gym_name, p_gym_slug)
  returning id into v_gym_id;

  insert into public.gym_branding (gym_id) values (v_gym_id);

  insert into public.staff (id, gym_id, role, full_name, email)
  values (v_uid, v_gym_id, 'owner', p_owner_name, coalesce(v_email, ''));

  return v_gym_id;
end;
$$;
grant execute on function public.complete_gym_owner_signup(text, text, text) to authenticated;

create or replace function public.complete_member_signup(p_gym_slug text, p_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_gym_id uuid;
  v_email text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select gym_id into v_gym_id from public.members where id = v_uid;
  if v_gym_id is not null then
    return v_gym_id;
  end if;

  select id into v_gym_id from public.gyms where slug = p_gym_slug;
  if v_gym_id is null then
    raise exception 'gym not found';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.members (id, gym_id, full_name, email)
  values (v_uid, v_gym_id, p_full_name, coalesce(v_email, ''));

  return v_gym_id;
end;
$$;
grant execute on function public.complete_member_signup(text, text) to authenticated;
