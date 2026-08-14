import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { IdeaMilestone, IdeaUserStory, ProjectIdeaPlanRow } from "@/types/db";

/**
 * Section 10 — "Build From My Idea". The learner enters idea/target user/
 * problem/outcome; this generates a PRD, user stories, architecture, data
 * model, milestones, and real usable workspace template content (README,
 * .env template, branch strategy) through the existing AI router. Nothing
 * here claims a repository was created — no GitHub OAuth App is configured
 * yet (see github_connections, Phase 5) — this produces content the learner
 * can paste into a repo themselves today. The plan is never auto-applied:
 * `approved` must be explicitly set by the learner before it's linked to a
 * real portfolio item.
 */

const SYSTEM_PROMPT = `You are a pragmatic technical product partner helping a Ropes learner turn a rough idea into a
real, buildable project. You will be given their idea, target user, problem, desired outcome, and optional features.
Produce a complete but SCOPED plan — buildable by one learner in a few weeks alongside a course, not an enterprise
system. No invented metrics, no promised business outcomes, no fabricated user counts. Respond with strict JSON only,
no markdown, in this exact shape:
{
  "prd": "<a real PRD: problem, goals, non-goals, scope, in 4-8 short paragraphs>",
  "userStories": [{"role": "<user type>", "want": "<what they want>", "soThat": "<why>"}],
  "acceptanceCriteria": ["<machine-checkable-ish criterion>", "..."],
  "architectureProposal": "<concrete architecture: components, data flow, key technical choices, 3-6 sentences>",
  "dataModel": "<the core entities and their relationships, as plain text, not SQL>",
  "milestones": [{"name": "<short milestone name>", "description": "<what ships in this milestone>"}],
  "courseMapping": "<1-2 sentences on which parts of their current Ropes course this project overlaps with, or empty string if none>",
  "suggestedRepoName": "<kebab-case repo name>",
  "readmeContent": "<a real, complete README.md in markdown: title, problem, features, tech stack, setup instructions>",
  "envTemplate": "<a real .env.example content block with plausible variable names for this project's stack, no real secrets>",
  "branchStrategy": "<2-4 sentences describing a simple branch strategy appropriate for a solo learner project>"
}
Provide 3-6 userStories, 4-8 acceptanceCriteria, and 3-5 milestones — no padding.`;

function fallbackPlan(idea: string, targetUser: string, problem: string, desiredOutcome: string) {
  return {
    prd: `Problem: ${problem}\n\nGoal: ${desiredOutcome}\n\nTarget user: ${targetUser}\n\nScope: a focused first version of "${idea}" that solves the core problem for one user type before adding anything else. Non-goals: anything not directly needed to prove the core idea works.`,
    userStories: [
      { role: targetUser, want: "to solve the core problem described", soThat: desiredOutcome },
    ] as IdeaUserStory[],
    acceptanceCriteria: [
      "The core user flow works end-to-end for the primary use case.",
      "The app handles the empty/first-run state without errors.",
      "There is a working deployed version, even a minimal one.",
    ],
    architectureProposal:
      "Start with the simplest architecture that proves the idea: one frontend, one backend/API layer, one datastore. Add complexity only when a specific requirement demands it.",
    dataModel: "Identify the 2-4 core entities this idea needs and how they relate — start there before adding anything else.",
    milestones: [
      { name: "Core flow works locally", description: "The primary user journey works end-to-end on your machine." },
      { name: "Deployed and usable", description: "A real person other than you can use it via a live URL." },
      { name: "Polish and edge cases", description: "Handle errors, empty states, and the rough edges you found using it." },
    ] as IdeaMilestone[],
    courseMapping: "",
    suggestedRepoName: idea
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "my-project",
    readmeContent: `# ${idea}\n\n## Problem\n${problem}\n\n## Who it's for\n${targetUser}\n\n## Outcome\n${desiredOutcome}\n\n## Setup\n1. Clone this repo\n2. Install dependencies\n3. Copy \`.env.example\` to \`.env\` and fill in real values\n4. Run the app\n`,
    envTemplate: `# Fill in real values — never commit this file with real secrets\nDATABASE_URL=\nAPI_KEY=\n`,
    branchStrategy: "Work directly on main for a solo project this size, or use one short-lived feature branch per milestone if you want practice with PRs.",
  };
}

export async function generateIdeaPlan(input: {
  userId: string;
  courseId?: string | null;
  idea: string;
  targetUser: string;
  problem: string;
  desiredOutcome: string;
  optionalFeatures?: string[];
}): Promise<ProjectIdeaPlanRow | null> {
  const result = await callAI({
    task: "idea_plan_generation",
    userId: input.userId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          idea: input.idea,
          targetUser: input.targetUser,
          problem: input.problem,
          desiredOutcome: input.desiredOutcome,
          optionalFeatures: input.optionalFeatures ?? [],
        }),
      },
    ],
  });

  let parsed: ReturnType<typeof fallbackPlan> | null = null;
  if (result) {
    try {
      const raw = result.content;
      const candidate = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      if (candidate.prd && Array.isArray(candidate.userStories) && candidate.readmeContent) {
        parsed = candidate;
      }
    } catch {
      parsed = null;
    }
  }
  const plan = parsed ?? fallbackPlan(input.idea, input.targetUser, input.problem, input.desiredOutcome);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("project_idea_plans")
    .insert({
      user_id: input.userId,
      course_id: input.courseId ?? null,
      idea: input.idea,
      target_user: input.targetUser,
      problem: input.problem,
      desired_outcome: input.desiredOutcome,
      optional_features: input.optionalFeatures ?? [],
      prd: plan.prd,
      user_stories: plan.userStories,
      acceptance_criteria: plan.acceptanceCriteria,
      architecture_proposal: plan.architectureProposal,
      data_model: plan.dataModel,
      milestones: plan.milestones,
      course_mapping: plan.courseMapping || null,
      suggested_repo_name: plan.suggestedRepoName,
      readme_content: plan.readmeContent,
      env_template: plan.envTemplate,
      branch_strategy: plan.branchStrategy,
    })
    .select("*")
    .single();

  if (error) return null;
  return data as ProjectIdeaPlanRow;
}

export async function approveIdeaPlan(userId: string, planId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("project_idea_plans")
    .update({ approved: true, approved_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("user_id", userId);
  return !error;
}

/** Links an approved plan to a real portfolio item — never overwrites an existing link. */
export async function linkIdeaPlanToProject(userId: string, planId: string, portfolioItemId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { data: plan } = await supabase
    .from("project_idea_plans")
    .select("approved, portfolio_item_id")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!plan || !plan.approved || plan.portfolio_item_id) return false;

  const { error } = await supabase
    .from("project_idea_plans")
    .update({ portfolio_item_id: portfolioItemId })
    .eq("id", planId)
    .eq("user_id", userId);
  return !error;
}
