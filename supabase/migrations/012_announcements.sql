create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  author_staff_id uuid references public.staff(id) on delete set null,
  author_member_id uuid references public.members(id) on delete set null,
  type text not null default 'post' check (type in ('post','event','congrats','reminder','update','challenge','for_sale','lost_found')),
  title text,
  body text not null,
  photo_url text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint announcements_one_author check (
    (author_staff_id is not null and author_member_id is null)
    or (author_staff_id is null and author_member_id is not null)
  )
);
alter table public.announcements enable row level security;

create policy "announcements_select" on public.announcements
  for select using (gym_id = public.current_gym_id());

create policy "announcements_insert" on public.announcements
  for insert with check (
    gym_id = public.current_gym_id()
    and (
      (author_staff_id = auth.uid() and public.current_staff_role() is not null)
      or (author_member_id = auth.uid() and public.is_current_member())
    )
    -- only staff can set type beyond the default "post", pin, or title
    and (public.current_staff_role() is not null or (type = 'post' and pinned = false))
  );

create policy "announcements_update" on public.announcements
  for update using (
    gym_id = public.current_gym_id()
    and (author_staff_id = auth.uid() or author_member_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  ) with check (
    gym_id = public.current_gym_id()
    and (author_staff_id = auth.uid() or author_member_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  );

create policy "announcements_delete" on public.announcements
  for delete using (
    gym_id = public.current_gym_id()
    and (author_staff_id = auth.uid() or author_member_id = auth.uid() or public.current_staff_role() in ('owner','manager'))
  );
