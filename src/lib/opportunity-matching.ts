/**
 * Deterministic skill-overlap scoring, not an LLM call — "does this user
 * have the skills this opportunity lists" is arithmetic, not reasoning.
 * Returns 0 for an opportunity with no listed required skills (nothing to
 * match against, so no score can honestly be claimed) rather than 100.
 *
 * `userSkillIds` should be the union of self-reported AND verified skill
 * ids (see computeSkillMatchBreakdown below for the classified version) —
 * a skill proved via a passed capstone counts toward the match even if the
 * learner never separately self-tagged it on /skills.
 */
export function computeMatchScore(userSkillIds: Set<string>, opportunityRequiredSkillIds: string[]): number {
  if (opportunityRequiredSkillIds.length === 0) return 0;
  const matched = opportunityRequiredSkillIds.filter((id) => userSkillIds.has(id)).length;
  return Math.round((matched / opportunityRequiredSkillIds.length) * 100);
}

export type SkillMatchStatus = "verified" | "self_reported" | "missing";

export interface SkillMatchEntry {
  skillId: string;
  status: SkillMatchStatus;
}

/**
 * Post-audit fix: opportunity matching previously treated every required
 * skill identically regardless of evidence. This classifies each required
 * skill as verified (real mastery evidence — see mastery.ts), self-reported
 * only, or missing entirely — never collapsed into one number, never
 * removing self-reported skills from consideration, just labeled honestly.
 */
export function computeSkillMatchBreakdown(
  verifiedSkillIds: Set<string>,
  selfReportedSkillIds: Set<string>,
  opportunityRequiredSkillIds: string[]
): SkillMatchEntry[] {
  return opportunityRequiredSkillIds.map((skillId) => ({
    skillId,
    status: verifiedSkillIds.has(skillId) ? "verified" : selfReportedSkillIds.has(skillId) ? "self_reported" : "missing",
  }));
}
