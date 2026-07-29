import type { TierFlags } from "@/lib/tiers";

// Real Stripe Price IDs for the "Lever AI LLC" connected account (live mode).
// Amounts ($99/$149/$199 monthly) are placeholders — edit them directly in
// the Stripe dashboard (Products > LeverCRM – *) without touching this file;
// only add a mapping here if a brand-new Price ID is created.
export const PRICE_TIER_FLAGS: Record<string, TierFlags> = {
  // Pro — price_1TydNoFGKmShNS5vxS3poP29 (prod_UyaYO08EhO2Ze7)
  price_1TydNoFGKmShNS5vxS3poP29: {
    private_lessons: true,
    gym_shop: true,
    email_automation: false,
    wearables: false,
  },
  // Premium — price_1TydNtFGKmShNS5vziKPjckX (prod_UyaYZ871HPeeNg)
  price_1TydNtFGKmShNS5vziKPjckX: {
    private_lessons: true,
    gym_shop: true,
    email_automation: true,
    wearables: false,
  },
  // Premium Plus — price_1TydNxFGKmShNS5vItUUrZ1O (prod_UyaYmDyqPd4acm)
  price_1TydNxFGKmShNS5vItUUrZ1O: {
    private_lessons: true,
    gym_shop: true,
    email_automation: true,
    wearables: true,
  },
};

export const BASE_TIER_FLAGS: TierFlags = {
  private_lessons: false,
  gym_shop: false,
  email_automation: false,
  wearables: false,
};
