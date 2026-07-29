-- Postgres grants EXECUTE to PUBLIC by default. Tighten down to exactly what
-- each function needs: RLS-helper functions only need to run as `authenticated`
-- (RLS never applies to anon here), trigger/cron functions should never be
-- callable directly via the REST API at all, and only the slug-check needs
-- to remain open to `anon` (used on the pre-signup form).

revoke execute on function public.current_gym_id() from public, anon;
revoke execute on function public.current_staff_role() from public, anon;
revoke execute on function public.is_current_member() from public, anon;
revoke execute on function public.gym_has_feature(uuid, text) from public, anon;
grant execute on function public.current_gym_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_current_member() to authenticated;
grant execute on function public.gym_has_feature(uuid, text) to authenticated;

revoke execute on function public.complete_gym_owner_signup(text, text, text) from public, anon;
revoke execute on function public.complete_member_signup(text, text) from public, anon;

revoke execute on function public.handle_class_booking_insert() from public, anon, authenticated;
revoke execute on function public.handle_class_booking_cancel() from public, anon, authenticated;
revoke execute on function public.sweep_expired_grace_periods() from public, anon, authenticated;
