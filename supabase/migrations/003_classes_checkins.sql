-- Class scheduling, bookings + waitlist, check-ins, member notifications

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  description text,
  instructor_staff_id uuid references public.staff(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity int not null check (capacity > 0),
  waitlist_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
create index classes_gym_id_idx on public.classes(gym_id);
create index classes_start_at_idx on public.classes(start_at);

create table public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked', 'waitlisted', 'cancelled')),
  waitlist_position int,
  created_at timestamptz not null default now(),
  unique (class_id, member_id)
);
create index class_bookings_class_id_idx on public.class_bookings(class_id);
create index class_bookings_member_id_idx on public.class_bookings(member_id);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  checked_in_by uuid not null references public.staff(id),
  checked_in_at timestamptz not null default now()
);
create index checkins_member_id_idx on public.checkins(member_id);
create index checkins_checked_in_at_idx on public.checkins(checked_in_at);

create view public.member_checkin_stats
with (security_invoker = true)
as
select
  member_id,
  gym_id,
  count(*) as lifetime_count,
  count(*) filter (where checked_in_at >= date_trunc('month', now())) as monthly_count
from public.checkins
group by member_id, gym_id;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_member_id_idx on public.notifications(member_id);

-- Capacity + waitlist trigger: decide booked vs waitlisted vs rejected on insert.
create or replace function public.handle_class_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_waitlist_enabled boolean;
  v_booked_count int;
  v_next_position int;
begin
  select capacity, waitlist_enabled into v_capacity, v_waitlist_enabled
  from public.classes where id = new.class_id;

  select count(*) into v_booked_count
  from public.class_bookings
  where class_id = new.class_id and status = 'booked';

  if v_booked_count < v_capacity then
    new.status := 'booked';
    new.waitlist_position := null;
  elsif v_waitlist_enabled then
    select coalesce(max(waitlist_position), 0) + 1 into v_next_position
    from public.class_bookings
    where class_id = new.class_id and status = 'waitlisted';
    new.status := 'waitlisted';
    new.waitlist_position := v_next_position;
  else
    raise exception 'class is full';
  end if;

  return new;
end;
$$;

create trigger class_bookings_before_insert
  before insert on public.class_bookings
  for each row execute function public.handle_class_booking_insert();

-- Auto-promote the earliest waitlisted booking when a booked one is cancelled.
-- SECURITY DEFINER: the member cancelling their own seat only has RLS rights
-- over their own row, but promoting the next person requires updating and
-- notifying a *different* member's row.
create or replace function public.handle_class_booking_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next record;
begin
  if old.status = 'booked' and new.status = 'cancelled' then
    select * into v_next
    from public.class_bookings
    where class_id = old.class_id and status = 'waitlisted'
    order by waitlist_position asc
    limit 1;

    if found then
      update public.class_bookings
      set status = 'booked', waitlist_position = null
      where id = v_next.id;

      insert into public.notifications (gym_id, member_id, message)
      values (
        v_next.gym_id,
        v_next.member_id,
        'A spot opened up — you have been moved from the waitlist to booked for your class.'
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger class_bookings_after_cancel
  after update on public.class_bookings
  for each row execute function public.handle_class_booking_cancel();

alter table public.classes enable row level security;
alter table public.class_bookings enable row level security;
alter table public.checkins enable row level security;
alter table public.notifications enable row level security;

-- classes: owner/manager manage; everyone in the gym (front_desk + members) can view.
create policy "classes_select" on public.classes
  for select using (gym_id = public.current_gym_id());
create policy "classes_insert_staff" on public.classes
  for insert with check (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'));
create policy "classes_update_staff" on public.classes
  for update using (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'))
  with check (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'));
create policy "classes_delete_staff" on public.classes
  for delete using (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'));

-- class_bookings: members manage their own booking; owner/manager/front_desk see all.
create policy "bookings_select" on public.class_bookings
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner', 'manager', 'front_desk') or member_id = auth.uid())
  );
create policy "bookings_insert" on public.class_bookings
  for insert with check (
    gym_id = public.current_gym_id()
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  );
create policy "bookings_update" on public.class_bookings
  for update using (
    gym_id = public.current_gym_id()
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  )
  with check (
    gym_id = public.current_gym_id()
    and (member_id = auth.uid() or public.current_staff_role() in ('owner', 'manager'))
  );

-- checkins: staff (all three roles) can record; owner/manager/front_desk read all, member reads own.
create policy "checkins_select" on public.checkins
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner', 'manager', 'front_desk') or member_id = auth.uid())
  );
create policy "checkins_insert_staff" on public.checkins
  for insert with check (
    gym_id = public.current_gym_id()
    and public.current_staff_role() in ('owner', 'manager', 'front_desk')
  );

-- notifications: a member only ever sees/updates (marks read) their own.
create policy "notifications_select_own" on public.notifications
  for select using (member_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (member_id = auth.uid()) with check (member_id = auth.uid());
