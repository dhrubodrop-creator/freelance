import "server-only";

/** Unadvertised full-comp code, checked server-side only — never shipped to the client bundle. */
export function isMasterPromoCode(code: string | null | undefined): boolean {
  const master = process.env.ROPES_MASTER_PROMO_CODE;
  if (!master || !code) return false;
  return code.trim().toUpperCase() === master.trim().toUpperCase();
}
