create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  subject text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
alter table public.message_threads enable row level security;

create table public.message_participants (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  constraint message_participants_one_kind check (
    (staff_id is not null and member_id is null) or (staff_id is null and member_id is not null)
  ),
  constraint message_participants_unique unique (thread_id, staff_id, member_id)
);
alter table public.message_participants enable row level security;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_staff_id uuid not null references public.staff(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

create or replace function public.is_thread_participant(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.message_participants
    where thread_id = p_thread_id
      and (staff_id = auth.uid() or member_id = auth.uid())
  );
$$;

-- Threads: staff (any role) see all their gym's threads; members only threads they're in.
create policy "message_threads_select" on public.message_threads
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() is not null or public.is_thread_participant(id))
  );
create policy "message_threads_insert" on public.message_threads
  for insert with check (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager','front_desk')
  );

create policy "message_participants_select" on public.message_participants
  for select using (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id and t.gym_id = public.current_gym_id()
    )
    and (public.current_staff_role() is not null or public.is_thread_participant(thread_id))
  );
create policy "message_participants_insert" on public.message_participants
  for insert with check (
    exists (
      select 1 from public.message_threads t
      where t.id = thread_id and t.gym_id = public.current_gym_id()
    )
    and public.current_staff_role() in ('owner','manager','front_desk')
  );

create policy "messages_select" on public.messages
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() is not null or public.is_thread_participant(thread_id))
  );
create policy "messages_insert" on public.messages
  for insert with check (
    gym_id = public.current_gym_id()
    and sender_staff_id = auth.uid()
    and public.current_staff_role() in ('owner','manager','front_desk')
  );

-- Notify a thread's member participants when a staff message lands, so the
-- in-app notifications feed and the messages page stay in sync automatically.
create or replace function public.notify_thread_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (gym_id, member_id, message, related_id)
  select new.gym_id, mp.member_id, 'New message', new.thread_id
  from public.message_participants mp
  where mp.thread_id = new.thread_id and mp.member_id is not null;

  update public.message_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

create trigger messages_notify_after_insert
  after insert on public.messages
  for each row execute function public.notify_thread_on_message();

revoke all on function public.notify_thread_on_message() from public, anon, authenticated;

-- Extend the existing waitlist-promotion notifications table to also carry
-- staff-facing notifications (e.g. new message) and a type/related_id.
alter table public.notifications alter column member_id drop not null;
alter table public.notifications add column staff_id uuid references public.staff(id) on delete cascade;
alter table public.notifications add column type text not null default 'general';
alter table public.notifications add column related_id uuid;
alter table public.notifications add constraint notifications_one_recipient check (
  (member_id is not null and staff_id is null) or (member_id is null and staff_id is not null)
);

drop policy "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (member_id = auth.uid() or staff_id = auth.uid());

drop policy "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (member_id = auth.uid() or staff_id = auth.uid())
  with check (member_id = auth.uid() or staff_id = auth.uid());
