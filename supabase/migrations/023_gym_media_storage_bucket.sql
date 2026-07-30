insert into storage.buckets (id, name, public)
values ('gym-media', 'gym-media', true)
on conflict (id) do nothing;

-- Every object lives under a {gym_id}/... path; writers must belong to
-- that gym (staff or member) — mirrors the tenant-isolation invariant
-- used everywhere else. Public bucket means reads don't need a policy.
create policy "gym_media_insert" on storage.objects
  for insert with check (
    bucket_id = 'gym-media' and (storage.foldername(name))[1] = public.current_gym_id()::text
  );

create policy "gym_media_update" on storage.objects
  for update using (
    bucket_id = 'gym-media' and (storage.foldername(name))[1] = public.current_gym_id()::text
  ) with check (
    bucket_id = 'gym-media' and (storage.foldername(name))[1] = public.current_gym_id()::text
  );

create policy "gym_media_delete" on storage.objects
  for delete using (
    bucket_id = 'gym-media' and (storage.foldername(name))[1] = public.current_gym_id()::text
  );
