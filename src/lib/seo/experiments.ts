export type CommercialFrictionReason =
  | "PRICE"
  | "TRUST"
  | "VALUE_CLARITY"
  | "PRODUCT_CONFUSION"
  | "LACK_OF_PROOF"
  | "LACK_OF_URGENCY"
  | "POOR_UX"
  | "WRONG_AUDIENCE";

export interface PricingExperimentConfig {
  activePricePoint: number;
  testTiers: number[];
  frictionDiagnosis: CommercialFrictionReason;
  recommendation: string;
}

export function getPricingExperimentConfig(): PricingExperimentConfig {
  return {
    activePricePoint: 50000,
    testTiers: [50000, 49000, 39000, 29000],
    frictionDiagnosis: "TRUST",
    recommendation: "Largest drop-off occurs at checkout due to TRUST / PROOF clarity rather than raw price elasticity. Do not lower price automatically; enhance client proof profile visibility."
  };
}
