import "server-only";

import { callAI } from "@/lib/ai/router";
import type { ProfileRow, SuggestedMonetisationPath } from "@/types/db";

export interface ReadinessScoreBreakdown {
  score: number;
  skillsPoints: number;
  portfolioPoints: number;
  profilePoints: number;
  goalsPoints: number;
}

/**
 * Deterministic arithmetic, not an LLM call — see src/lib/skill-gap.ts for
 * why this split matters. Every point is explainable: skills (25 max),
 * portfolio/proof (30 max — weighted highest, since proof is what actually
 * makes a monetisation path credible), profile completeness (25 max), and
 * stated goals (20 max).
 *
 * `verifiedSkillsCount` (mastery level DEMONSTRATED/STRONG from
 * src/lib/mastery.ts — real evidence: a completed module + practiced
 * exercise + portfolio proof, not a self-rating) is optional and, when
 * higher than the learner's self-reported skill count, is used instead.
 * Evidence is strictly more credible than a claim, so it can only raise this
 * component, never lower it below what the learner already self-reported.
 */
export function computeReadinessScore(input: {
  skillsCount: number;
  verifiedSkillsCount?: number;
  portfolioCount: number;
  profileCompletionPercent: number;
  hasIncomeGoal: boolean;
  hasWorkPreference: boolean;
}): ReadinessScoreBreakdown {
  const effectiveSkillsCount = Math.max(input.skillsCount, input.verifiedSkillsCount ?? 0);
  const skillsPoints = Math.round(Math.min(effectiveSkillsCount / 5, 1) * 25);
  const portfolioPoints = Math.round(Math.min(input.portfolioCount / 2, 1) * 30);
  const profilePoints = Math.round((input.profileCompletionPercent / 100) * 25);
  const goalsPoints = (input.hasIncomeGoal ? 10 : 0) + (input.hasWorkPreference ? 10 : 0);

  return {
    score: skillsPoints + portfolioPoints + profilePoints + goalsPoints,
    skillsPoints,
    portfolioPoints,
    profilePoints,
    goalsPoints,
  };
}

export interface MonetisationPlanResult {
  summary: string;
  suggestedPaths: SuggestedMonetisationPath[];
  weeklyActions: { weekNumber: number; task: string }[];
}

const SYSTEM_PROMPT = `You are the monetisation-planning engine for Ropes, a platform that helps working
professionals turn AI/no-code skills into freelance or solo-entrepreneur income.

You will be given a student's profile, the skills they've self-added to their profile, which of those
(or others) they have real EVIDENCE for (a completed module + a practiced exercise + an actual
portfolio project — not just a claim), their portfolio project titles, and — if available — the
skills their recommended course track still expects them to build (their "skill gap").

Weight evidence-backed skills higher than self-reported-only skills when reasoning about what a
learner can credibly offer a client today — a self-rating with no evidence behind it is a weaker
signal than a skill they've actually shipped a project with. When a suggested path's "skillsPresent"
includes a skill that has real evidence, say so explicitly (e.g. "with a shipped project to back it up").

Generate a personalised, honest monetisation plan. Use language like "based on your profile",
"potential", "suggested" — never promise a specific income or guarantee a job/client. Only recommend
categories that genuinely fit what's in front of you (Employment, Freelancing, Consulting,
Productised Services, Digital Products, Creator, Business) — do not recommend every category to
every user.

Respond with strict JSON only, no markdown, in this exact shape:
{
  "summary": "<2-3 sentences, second-person, grounded in their actual skills/portfolio/goal>",
  "suggestedPaths": [
    {"name": "<short path name, e.g. 'Freelance automation implementation'>", "reasoning": "<1-2 sentences why this fits them specifically>", "skillsPresent": ["<skill names they already have that support this>"], "skillsNeeded": ["<skill names or capabilities still missing>"]}
  ],
  "weeklyActions": [
    {"weekNumber": 1, "task": "<one concrete task>"},
    {"weekNumber": 2, "task": "<one concrete task>"},
    {"weekNumber": 3, "task": "<one concrete task>"},
    {"weekNumber": 4, "task": "<one concrete task>"}
  ]
}
Provide 1-3 suggestedPaths depending on how much real signal you have — fewer, better-reasoned paths beat a padded list.`;

function fallbackPlan(careerGoal: string | null): MonetisationPlanResult {
  const pathName =
    careerGoal === "career_switch"
      ? "Full-time employment in your new track"
      : careerGoal === "side_income"
        ? "Freelance projects alongside your current role"
        : "Freelance client work";

  return {
    summary:
      "Based on what's in your profile so far, the clearest next step is finishing your first real project and turning it into proof — the specific monetisation path will get sharper as you add more skills and portfolio work.",
    suggestedPaths: [
      {
        name: pathName,
        reasoning: "A reasonable default given your stated goal — refine this as your profile fills out.",
        skillsPresent: [],
        skillsNeeded: ["A finished portfolio project", "At least 2-3 skills added to your profile"],
      },
    ],
    weeklyActions: [
      { weekNumber: 1, task: "Finish your current course module and add the skills it covers to your profile." },
      { weekNumber: 2, task: "Turn your in-progress build into a portfolio project with a clear problem/solution/outcome." },
      { weekNumber: 3, task: "Write a one-line offer describing what you can do for a client, using your portfolio as proof." },
      { weekNumber: 4, task: "Reach out to 5 people who might need that offer — a former colleague is the fastest start." },
    ],
  };
}

export async function generateMonetisationPlan(input: {
  profile: Pick<ProfileRow, "occupation" | "industry" | "career_goal" | "income_goal_inr" | "work_preference">;
  skillNames: string[];
  verifiedSkillNames: string[];
  portfolioTitles: string[];
  recommendedTrack: string | null;
  skillGapMissing: string[];
  userId?: string | null;
}): Promise<MonetisationPlanResult> {
  const result = await callAI({
    task: "monetisation_planning",
    userId: input.userId ?? null,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          profile: input.profile,
          skills: input.skillNames,
          evidenceBackedSkills: input.verifiedSkillNames,
          portfolioProjects: input.portfolioTitles,
          recommendedTrack: input.recommendedTrack,
          skillGapForRecommendedTrack: input.skillGapMissing,
        }),
      },
    ],
  });

  if (result) {
    try {
      const raw = result.content;
      const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as MonetisationPlanResult;
      if (parsed.summary && Array.isArray(parsed.suggestedPaths) && Array.isArray(parsed.weeklyActions)) {
        return parsed;
      }
    } catch {
      // fall through to deterministic fallback below
    }
  }
  return fallbackPlan(input.profile.career_goal);
}
