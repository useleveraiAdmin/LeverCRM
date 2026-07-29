-- Family linkage (self-referencing, matches Momentum's parent_client_id pattern)
alter table public.members add column parent_member_id uuid references public.members(id) on delete set null;

-- Waivers / intake documents, staff-driven with member read access
create table public.member_documents (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null check (type in ('waiver','intake','other')),
  title text not null,
  signature_data_url text,
  signed_at timestamptz,
  created_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.member_documents enable row level security;

create policy "member_documents_select" on public.member_documents
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner','manager','front_desk') or member_id = auth.uid())
  );
create policy "member_documents_insert" on public.member_documents
  for insert with check (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager','front_desk')
  );
create policy "member_documents_update" on public.member_documents
  for update using (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  ) with check (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  );
create policy "member_documents_delete" on public.member_documents
  for delete using (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager')
  );

-- Notes: team notes (member_id null) and per-client notes (member_id set) — staff-internal, never visible to members
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  author_staff_id uuid not null references public.staff(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notes enable row level security;

create policy "notes_select" on public.notes
  for select using (
    gym_id = public.current_gym_id() and public.current_staff_role() in ('owner','manager','front_desk')
  );
create policy "notes_insert" on public.notes
  for insert with check (
    gym_id = public.current_gym_id()
    and public.current_staff_role() in ('owner','manager','front_desk')
    and author_staff_id = auth.uid()
  );
create policy "notes_update" on public.notes
  for update using (
    gym_id = public.current_gym_id()
    and (author_staff_id = auth.uid() or public.current_staff_role() = 'owner')
  ) with check (
    gym_id = public.current_gym_id()
    and (author_staff_id = auth.uid() or public.current_staff_role() = 'owner')
  );
create policy "notes_delete" on public.notes
  for delete using (
    gym_id = public.current_gym_id()
    and (author_staff_id = auth.uid() or public.current_staff_role() = 'owner')
  );
