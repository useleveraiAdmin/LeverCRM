export type TierFlags = {
  private_lessons: boolean;
  gym_shop: boolean;
  email_automation: boolean;
  wearables: boolean;
};

export const DEFAULT_TIER_FLAGS: TierFlags = {
  private_lessons: false,
  gym_shop: false,
  email_automation: false,
  wearables: false,
};

export function hasFeature(flags: TierFlags | null | undefined, feature: keyof TierFlags) {
  return Boolean(flags?.[feature]);
}

export function deriveTierLabel(flags: TierFlags): string {
  if (flags.wearables) return "Premium Plus";
  if (flags.email_automation) return "Premium";
  if (flags.private_lessons || flags.gym_shop) return "Pro";
  return "Base";
}
