export const PROMO_DISCOUNT_PERCENT = 70;

/** Standing launch-price discount applied everywhere a course price is shown. */
export function getDiscountedPrice(originalPrice: number): number {
  return Math.round(originalPrice * (1 - PROMO_DISCOUNT_PERCENT / 100));
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
