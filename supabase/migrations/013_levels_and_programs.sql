create table public.gym_levels (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gym_levels enable row level security;

create policy "gym_levels_select" on public.gym_levels
  for select using (gym_id = public.current_gym_id());
create policy "gym_levels_manage" on public.gym_levels
  for all using (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  ) with check (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  );

alter table public.members add column level_id uuid references public.gym_levels(id) on delete set null;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  tagline text,
  description text,
  highlights jsonb not null default '[]'::jsonb,
  level_tags jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.programs enable row level security;

create policy "programs_select" on public.programs
  for select using (gym_id = public.current_gym_id());
create policy "programs_manage" on public.programs
  for all using (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  ) with check (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  );
