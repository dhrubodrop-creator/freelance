export const PROMO_DISCOUNT_PERCENT = 70;

/**
 * Special-discount sale price (INR) per course slug, deliberately kept in the
 * ₹49–₹99 impulse-buy band and tiered by course depth/original list price —
 * a Claude Code course and a Forward Deployed Engineer course shouldn't cost
 * the same. Falls back to the standing 70%-off calculation for any course
 * not in this map.
 */
export const SPECIAL_PRICE_INR: Record<string, number> = {
  "claude-code-ai": 49,
  "data-science-ai-ml": 49,

  "agentic-ai": 59,
  "generative-ai-genai": 59,
  "aws-ai": 59,

  "ai-product-management": 69,
  "azure-ai": 69,
  "gcp-ai": 69,

  "ai-stack": 79,
  "mlops-machine-learning-operations": 79,
  aiops: 79,
  "ai-llm-testing": 79,

  "agentic-ai-development-with-langchain-langgraph": 89,
  "ai-agents-for-devops-engineers": 89,
  "data-science-with-generative-ai": 89,

  "ai-agents-with-n8n-no-code": 99,
  llmops: 99,
  "ai-security": 99,
  "ai-engineering-for-forward-deployed-engineer": 99,

  // Trial pricing — real ₹1 price, not a fake discount badge. Mapped
  // explicitly so getDiscountedPrice never falls through to the 70%-off
  // formula (which would round 30% of ₹1 down to ₹0).
  "ai-native-web-app-builder": 1,
  "ai-native-website-builder": 1,
};

/** Special-discount sale price, falling back to the standing 70%-off launch price. */
export function getDiscountedPrice(originalPrice: number, slug?: string): number {
  if (slug && SPECIAL_PRICE_INR[slug] !== undefined) return SPECIAL_PRICE_INR[slug];
  return Math.round(originalPrice * (1 - PROMO_DISCOUNT_PERCENT / 100));
}

/**
 * The real percentage off list price, for display — computed, never hardcoded.
 * Floored and capped at 99: this course is still a paid purchase, so the
 * badge must never round up to "100% off" and read as the unrelated
 * unified 100%-off promo code.
 */
export function getDiscountPercent(originalPrice: number, slug?: string): number {
  const discounted = getDiscountedPrice(originalPrice, slug);
  if (originalPrice <= 0 || discounted <= 0) return 0;
  return Math.min(99, Math.floor((1 - discounted / originalPrice) * 100));
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
