-- Resolve display names for member-authored announcements in the caller's
-- own gym, without loosening the members table's own-row-only RLS.
create or replace function public.get_member_names(p_member_ids uuid[])
returns table (member_id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.full_name
  from public.members m
  where m.id = any(p_member_ids)
    and m.gym_id = public.current_gym_id();
$$;

revoke all on function public.get_member_names(uuid[]) from public;
grant execute on function public.get_member_names(uuid[]) to authenticated;
