// Deno-side mirror of lib/stripe-tiers.ts (Next.js can't be imported into an
// Edge Function's Deno runtime, so this mapping is duplicated — keep both in
// sync when prices change).
export type TierFlags = {
  private_lessons: boolean;
  gym_shop: boolean;
  email_automation: boolean;
  wearables: boolean;
};

export const BASE_TIER_FLAGS: TierFlags = {
  private_lessons: false,
  gym_shop: false,
  email_automation: false,
  wearables: false,
};

export const PRICE_TIER_FLAGS: Record<string, TierFlags> = {
  price_1TydNoFGKmShNS5vxS3poP29: {
    private_lessons: true,
    gym_shop: true,
    email_automation: false,
    wearables: false,
  },
  price_1TydNtFGKmShNS5vziKPjckX: {
    private_lessons: true,
    gym_shop: true,
    email_automation: true,
    wearables: false,
  },
  price_1TydNxFGKmShNS5vItUUrZ1O: {
    private_lessons: true,
    gym_shop: true,
    email_automation: true,
    wearables: true,
  },
};
