-- Let members see who else (member_id only, no other member fields) is
-- booked on a class in their own gym, for the "who's going" attendee list.
-- Kept separate from the existing member-select-own policy (Postgres ORs
-- multiple permissive policies together automatically).
create policy "bookings_select_gym_roster" on public.class_bookings
  for select using (
    gym_id = public.current_gym_id() and status = 'booked'
  );

-- members table RLS still restricts a member to only their OWN row, so
-- resolve attendee names via a narrow SECURITY DEFINER function that
-- exposes just (member_id, full_name) for members with a booked seat on a
-- class in the caller's own gym — never phone/DOB/email.
create or replace function public.get_class_attendees(p_class_id uuid)
returns table (member_id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.full_name
  from public.class_bookings cb
  join public.members m on m.id = cb.member_id
  join public.classes c on c.id = cb.class_id
  where cb.class_id = p_class_id
    and cb.status = 'booked'
    and c.gym_id = public.current_gym_id();
$$;

revoke all on function public.get_class_attendees(uuid) from public;
grant execute on function public.get_class_attendees(uuid) to authenticated;
