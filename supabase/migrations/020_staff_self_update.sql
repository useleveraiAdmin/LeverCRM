-- Let staff update their own row (payment handles, name) without letting
-- them escalate their own role or move themselves to another gym — those
-- stay owner-only via the trigger guard below.
create policy "staff_update_self" on public.staff
  for update using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.guard_staff_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_staff_role() != 'owner' then
    if new.role is distinct from old.role or new.gym_id is distinct from old.gym_id then
      raise exception 'Only the gym owner can change staff role or gym assignment';
    end if;
  end if;
  return new;
end;
$$;

create trigger staff_guard_self_update
  before update on public.staff
  for each row execute function public.guard_staff_self_update();
