import "server-only";

import type {
  DiagnosticExperienceLevel,
  DiagnosticSkillRating,
  ModuleGuidance,
  ModuleGuidanceDepth,
} from "@/types/db";

/**
 * Deterministic, plain-code scoring — not an LLM call — matching this
 * project's existing split (src/lib/skill-gap.ts, the readiness score in
 * src/lib/monetisation.ts): the AI reasons/writes prose, normal code
 * computes scores and permissions.
 *
 * A module only ever gets a non-'full' depth when there's real signal for
 * it (the module has a mapped skill in `module_skills`, and the learner
 * rated that skill). No signal -> 'full', never a guess. This keeps the
 * diagnostic honest and means it strengthens automatically as more modules
 * get `module_skills` tags, without any code change here.
 */

const RATING_SCORE: Record<DiagnosticSkillRating, number> = {
  unfamiliar: 0,
  aware: 1,
  practiced: 2,
  confident: 3,
};

export interface DiagnosticModuleInput {
  id: string;
  title: string;
  orderIndex: number;
  skillIds: string[];
}

export interface DiagnosticInput {
  experienceLevel: DiagnosticExperienceLevel;
  confidenceRating: number;
  skillRatings: Record<string, DiagnosticSkillRating>;
  modules: DiagnosticModuleInput[];
  skillNamesById: Record<string, string>;
}

export interface DiagnosticResult {
  moduleGuidance: Record<string, ModuleGuidance>;
  startingPoint: string;
}

function computeModuleDepth(
  skillIds: string[],
  skillRatings: Record<string, DiagnosticSkillRating>,
  skillNamesById: Record<string, string>,
  experienceLevel: DiagnosticExperienceLevel,
  confidenceRating: number
): ModuleGuidance {
  if (skillIds.length === 0) {
    return {
      depth: "full",
      reason: "No skill signal is mapped to this module yet — showing the full module.",
    };
  }

  const ratedSkillNames = skillIds
    .map((id) => skillNamesById[id])
    .filter((n): n is string => Boolean(n));
  const scores = skillIds.map((id) => RATING_SCORE[skillRatings[id] ?? "unfamiliar"]);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const skillList = ratedSkillNames.join(", ") || "this module's skills";

  let depth: ModuleGuidanceDepth;
  let reason: string;

  if (avg >= 2.5 && experienceLevel === "professional" && confidenceRating >= 5) {
    depth = "advanced_challenge";
    reason = `You rated yourself confident and experienced in ${skillList} — try the advanced/capstone-level exercises first, and fall back to the full module if you get stuck.`;
  } else if (avg >= 2.5) {
    depth = "review";
    reason = `You rated yourself confident in ${skillList} — a quick review should cover it, but the full module is right here if you want it.`;
  } else if (avg >= 1.5) {
    depth = "full";
    reason = `You've had some exposure to ${skillList} — the full module will fill the gaps.`;
  } else {
    depth = "foundation_plus_practice";
    reason = `${skillList} is new or unfamiliar territory — take the full module plus the practice exercises before moving on.`;
  }

  return { depth, reason };
}

function computeStartingPoint(
  experienceLevel: DiagnosticExperienceLevel,
  moduleGuidance: Record<string, ModuleGuidance>
): string {
  const depths = Object.values(moduleGuidance).map((g) => g.depth);
  const reviewCount = depths.filter((d) => d === "review" || d === "advanced_challenge").length;
  const foundationCount = depths.filter((d) => d === "foundation_plus_practice").length;
  const total = depths.length || 1;

  const experienceLabel: Record<DiagnosticExperienceLevel, string> = {
    new: "You're starting fresh with this subject.",
    some_exposure: "You've been exposed to this subject but haven't built much with it yet.",
    practiced: "You've practiced this subject before, just not necessarily this exact stack.",
    professional: "You already work in or near this subject professionally.",
  };

  if (reviewCount === 0 && foundationCount === 0) {
    return `${experienceLabel[experienceLevel]} We don't have enough skill-mapping signal yet to point you to specific modules, so start at the top and work through in order — the full curriculum is always available regardless.`;
  }
  if (foundationCount >= Math.ceil(total * 0.5)) {
    return `${experienceLabel[experienceLevel]} Most of this course will be new ground for you — plan to work through every module with its practice exercises rather than skimming ahead.`;
  }
  if (reviewCount >= Math.ceil(total * 0.5)) {
    return `${experienceLabel[experienceLevel]} You already have real footing in most of what this course covers — skim the modules flagged "review" and spend your time on the rest.`;
  }
  return `${experienceLabel[experienceLevel]} It's a mixed picture: some modules are review for you, others are new — check each module's guidance badge before deciding how much time to spend.`;
}

export function computeDiagnosticResult(input: DiagnosticInput): DiagnosticResult {
  const moduleGuidance: Record<string, ModuleGuidance> = {};
  for (const courseModule of input.modules) {
    moduleGuidance[courseModule.id] = computeModuleDepth(
      courseModule.skillIds,
      input.skillRatings,
      input.skillNamesById,
      input.experienceLevel,
      input.confidenceRating
    );
  }
  const startingPoint = computeStartingPoint(input.experienceLevel, moduleGuidance);
  return { moduleGuidance, startingPoint };
}
