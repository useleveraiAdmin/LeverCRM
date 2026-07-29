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
