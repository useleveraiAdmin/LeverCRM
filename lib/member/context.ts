import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIER_FLAGS, type TierFlags } from "@/lib/tiers";

export type MemberContext = {
  userId: string;
  memberId: string;
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

export async function getMemberContext(gymSlug: string): Promise<MemberContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${gymSlug}/login`);

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, full_name, gym_id, gyms(name, slug, tier_flags, gym_branding(logo_url, primary_color, secondary_color))"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!member) redirect(`/portal/${gymSlug}/login?error=not_member`);

  const gym = member.gyms as unknown as {
    name: string;
    slug: string;
    tier_flags: TierFlags;
    gym_branding: { logo_url: string | null; primary_color: string | null; secondary_color: string | null } | null;
  };

  if (gym.slug !== gymSlug) redirect(`/portal/${gym.slug}/calendar`);

  return {
    userId: user.id,
    memberId: member.id,
    fullName: member.full_name,
    gymId: member.gym_id,
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
