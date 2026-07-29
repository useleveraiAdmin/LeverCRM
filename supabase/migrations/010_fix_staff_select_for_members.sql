-- Members need to see staff/instructor names (class instructor display,
-- appointment booking's instructor picker) — the original policy only let
-- owner see everyone and non-owner staff see their own row, silently hiding
-- all staff from plain members.
drop policy "staff_select" on public.staff;

create policy "staff_select" on public.staff
  for select using (
    gym_id = public.current_gym_id()
    and (public.current_staff_role() = 'owner' or id = auth.uid() or public.is_current_member())
  );
