/**
 * Deterministic skill-overlap scoring, not an LLM call — "does this user
 * have the skills this opportunity lists" is arithmetic, not reasoning.
 * Returns 0 for an opportunity with no listed required skills (nothing to
 * match against, so no score can honestly be claimed) rather than 100.
 */
export function computeMatchScore(userSkillIds: Set<string>, opportunityRequiredSkillIds: string[]): number {
  if (opportunityRequiredSkillIds.length === 0) return 0;
  const matched = opportunityRequiredSkillIds.filter((id) => userSkillIds.has(id)).length;
  return Math.round((matched / opportunityRequiredSkillIds.length) * 100);
}
