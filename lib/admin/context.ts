import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIER_FLAGS, type TierFlags } from "@/lib/tiers";

export type AdminContext = {
  userId: string;
  staffId: string;
  role: "owner" | "manager" | "front_desk";
  fullName: string;
  gymId: string;
  gymName: string;
  gymSlug: string;
  tierFlags: TierFlags;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
};

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staff } = await supabase
    .from("staff")
    .select(
      "id, role, full_name, gym_id, gyms(name, slug, tier_flags, gym_branding(logo_url, primary_color, secondary_color))"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) redirect("/login?error=not_staff");

  const gym = staff.gyms as unknown as {
    name: string;
    slug: string;
    tier_flags: TierFlags;
    gym_branding: { logo_url: string | null; primary_color: string | null; secondary_color: string | null } | null;
  };

  return {
    userId: user.id,
    staffId: staff.id,
    role: staff.role as AdminContext["role"],
    fullName: staff.full_name,
    gymId: staff.gym_id,
    gymName: gym.name,
    gymSlug: gym.slug,
    tierFlags: { ...DEFAULT_TIER_FLAGS, ...(gym.tier_flags as Partial<TierFlags>) },
    branding: {
      logoUrl: gym.gym_branding?.logo_url ?? null,
      primaryColor: gym.gym_branding?.primary_color ?? null,
      secondaryColor: gym.gym_branding?.secondary_color ?? null,
    },
  };
}
