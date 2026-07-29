import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type StaffSignupMeta = {
  role_intent?: string;
  gym_name?: string;
  gym_slug?: string;
  owner_name?: string;
};

type MemberSignupMeta = {
  role_intent?: string;
  gym_slug?: string;
  full_name?: string;
};

// Profile creation is deferred until first login (not signup time) because
// email confirmation is on: there is no authenticated session — and RLS
// insert policies require one — until the user confirms and logs in. The
// signup form stashes what it collected in auth user_metadata; this runs it
// through the SECURITY DEFINER RPC exactly once (both RPCs are idempotent).
export async function completeStaffSignupIfNeeded(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<string | null> {
  const meta = user.user_metadata as StaffSignupMeta;
  if (meta?.role_intent !== "gym_owner") return null;

  const { data: existing } = await supabase
    .from("staff")
    .select("gym_id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing.gym_id;

  if (!meta.gym_name || !meta.gym_slug || !meta.owner_name) return null;

  const { data, error } = await supabase.rpc("complete_gym_owner_signup", {
    p_gym_name: meta.gym_name,
    p_gym_slug: meta.gym_slug,
    p_owner_name: meta.owner_name,
  });
  if (error) throw error;
  return data;
}

export async function completeMemberSignupIfNeeded(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<string | null> {
  const meta = user.user_metadata as MemberSignupMeta;
  if (meta?.role_intent !== "member") return null;

  const { data: existing } = await supabase
    .from("members")
    .select("gym_id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing.gym_id;

  if (!meta.gym_slug || !meta.full_name) return null;

  const { data, error } = await supabase.rpc("complete_member_signup", {
    p_gym_slug: meta.gym_slug,
    p_full_name: meta.full_name,
  });
  if (error) throw error;
  return data;
}
