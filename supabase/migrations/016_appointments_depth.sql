alter table public.staff add column venmo_handle text;
alter table public.staff add column cashapp_handle text;
alter table public.staff add column zelle_handle text;
alter table public.staff add column applecash_handle text;

create table public.instructor_availability (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint instructor_availability_time_order check (start_time < end_time)
);
alter table public.instructor_availability enable row level security;

create table public.instructor_blocks (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.instructor_blocks enable row level security;

create policy "instructor_availability_select" on public.instructor_availability
  for select using (gym_id = public.current_gym_id());
create policy "instructor_availability_manage" on public.instructor_availability
  for all using (
    gym_id = public.current_gym_id()
    and (staff_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  ) with check (
    gym_id = public.current_gym_id()
    and (staff_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  );

create policy "instructor_blocks_select" on public.instructor_blocks
  for select using (gym_id = public.current_gym_id());
create policy "instructor_blocks_manage" on public.instructor_blocks
  for all using (
    gym_id = public.current_gym_id()
    and (staff_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  ) with check (
    gym_id = public.current_gym_id()
    and (staff_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  );
