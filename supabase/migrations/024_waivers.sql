-- Liability waivers: gym-uploaded PDF templates, member signatures (three
-- capture paths), and the resulting signed PDFs. Legal-defensibility notes:
--   - "external_upload" records a waiver that was already executed outside
--     the app (e.g. paper). We didn't witness that signing electronically,
--     so no esign consent/typed-name/IP is captured for it — instead the
--     staff member attests to its validity (attestation_confirmed) and is
--     recorded as the uploader (witnessed_by_staff_id).
--   - "in_person" and "self_serve" are both genuine electronic signature
--     ceremonies (typed name + drawn signature + separate esign consent +
--     IP/user-agent/timestamp captured server-side) and always go through
--     the service-role /api/waivers/sign route rather than a direct client
--     insert, so the audit fields can't be spoofed from the browser.
--   - waiver_signatures rows are immutable via client roles (no update/delete
--     policy at all) — this is meant to be a durable legal record.

create table public.waivers (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  title text not null,
  version int not null default 1,
  storage_path text not null,
  file_hash text not null,
  is_active boolean not null default true,
  created_by uuid not null references public.staff(id),
  created_at timestamptz not null default now()
);
create index waivers_gym_id_idx on public.waivers(gym_id);
-- Uploading a replacement waiver deactivates the old one rather than
-- overwriting it, so existing signatures stay tied to the exact version
-- signed. Only one version can be "the" current one at a time.
create unique index waivers_one_active_per_gym on public.waivers(gym_id) where is_active;

create table public.waiver_signatures (
  id uuid primary key default gen_random_uuid(),
  waiver_id uuid references public.waivers(id) on delete restrict,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  capture_method text not null check (capture_method in ('external_upload', 'in_person', 'self_serve')),
  typed_name text,
  esign_consent_at timestamptz,
  ip_address text,
  user_agent text,
  witnessed_by_staff_id uuid references public.staff(id),
  attestation_confirmed boolean not null default false,
  final_pdf_path text not null,
  final_pdf_hash text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  -- A gym that only ever collects paper waivers offline may never upload an
  -- in-app template, so external_upload is the one path allowed to skip it.
  constraint waiver_required_unless_external_upload
    check (waiver_id is not null or capture_method = 'external_upload'),
  constraint witness_required_for_staff_captured
    check (capture_method = 'self_serve' or witnessed_by_staff_id is not null),
  constraint esign_fields_required_for_electronic_capture
    check (capture_method = 'external_upload' or (typed_name is not null and esign_consent_at is not null)),
  constraint attestation_required_for_external_upload
    check (capture_method != 'external_upload' or attestation_confirmed = true)
);
create index waiver_signatures_gym_id_idx on public.waiver_signatures(gym_id);
create index waiver_signatures_member_id_idx on public.waiver_signatures(member_id);
create unique index waiver_signatures_one_per_waiver_member on public.waiver_signatures(waiver_id, member_id) where waiver_id is not null;

alter table public.waivers enable row level security;
alter table public.waiver_signatures enable row level security;

-- waivers: any staff or member of the tenant can read (members need to read
-- it to render + sign); only owner/manager can publish new versions.
create policy "waivers_select" on public.waivers
  for select using (gym_id = public.current_gym_id());
create policy "waivers_insert_owner_manager" on public.waivers
  for insert with check (
    gym_id = public.current_gym_id()
    and public.current_staff_role() in ('owner', 'manager')
    and created_by = auth.uid()
  );
create policy "waivers_update_owner_manager" on public.waivers
  for update using (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'))
  with check (gym_id = public.current_gym_id() and public.current_staff_role() in ('owner', 'manager'));

-- waiver_signatures: staff (owner/manager/front_desk) can read everything for
-- their gym; a member can read only their own. Only external_upload can be
-- inserted directly from the client (RLS-enforced attestation + witness);
-- in_person and self_serve are inserted by /api/waivers/sign using the
-- service-role client after it verifies the caller server-side.
create policy "waiver_signatures_select" on public.waiver_signatures
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() in ('owner', 'manager', 'front_desk') or member_id = auth.uid())
  );
create policy "waiver_signatures_insert_external_upload" on public.waiver_signatures
  for insert with check (
    gym_id = public.current_gym_id()
    and public.current_staff_role() in ('owner', 'manager')
    and capture_method = 'external_upload'
    and witnessed_by_staff_id = auth.uid()
    and attestation_confirmed = true
  );

-- Storage: two private buckets. waiver-templates holds the gym's blank PDF
-- (readable by the whole tenant so members can view what they're signing);
-- signed-waivers holds the final per-member record, readable by tenant staff
-- and by the member it belongs to.
insert into storage.buckets (id, name, public)
values ('waiver-templates', 'waiver-templates', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('signed-waivers', 'signed-waivers', false)
on conflict (id) do nothing;

-- waiver-templates paths: {gym_id}/{waiver_id}.pdf
create policy "waiver_templates_select" on storage.objects
  for select using (
    bucket_id = 'waiver-templates' and (storage.foldername(name))[1] = public.current_gym_id()::text
  );
create policy "waiver_templates_insert" on storage.objects
  for insert with check (
    bucket_id = 'waiver-templates'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and public.current_staff_role() in ('owner', 'manager')
  );
create policy "waiver_templates_update" on storage.objects
  for update using (
    bucket_id = 'waiver-templates'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and public.current_staff_role() in ('owner', 'manager')
  ) with check (
    bucket_id = 'waiver-templates'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and public.current_staff_role() in ('owner', 'manager')
  );

-- signed-waivers paths: {gym_id}/{member_id}/{signature_id}.pdf. Only staff
-- write directly from the browser (external_upload); self_serve/in_person
-- are written by the service-role route, which bypasses storage RLS too.
create policy "signed_waivers_select" on storage.objects
  for select using (
    bucket_id = 'signed-waivers'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and (
      public.current_staff_role() in ('owner', 'manager', 'front_desk')
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );
create policy "signed_waivers_insert_staff" on storage.objects
  for insert with check (
    bucket_id = 'signed-waivers'
    and (storage.foldername(name))[1] = public.current_gym_id()::text
    and public.current_staff_role() in ('owner', 'manager')
  );
