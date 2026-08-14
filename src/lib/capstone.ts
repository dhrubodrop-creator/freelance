import "server-only";

import { callAI } from "@/lib/ai/router";
import type { VerificationEvidenceSummary } from "@/lib/capstone-evidence";
import type {
  DefenceAnswer,
  DefenceQuestion,
  DimensionScore,
  PortfolioItemRow,
  ProjectDecisionRow,
} from "@/types/db";

interface ProjectContext {
  title: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  outcome: string | null;
  toolsUsed: string[];
}

function projectContextFromItem(item: PortfolioItemRow): ProjectContext {
  return {
    title: item.title,
    description: item.description,
    problem: item.problem,
    solution: item.solution,
    outcome: item.outcome,
    toolsUsed: item.tools_used,
  };
}

function decisionsToText(decisions: ProjectDecisionRow[]): string {
  if (decisions.length === 0) return "No decisions logged.";
  return decisions
    .map(
      (d, i) =>
        `${i + 1}. Decision: ${d.decision}\n   Alternatives considered: ${d.alternatives ?? "none noted"}\n   Reasoning: ${d.reasoning}\n   Tradeoff: ${d.tradeoff ?? "none noted"}`
    )
    .join("\n");
}

const DEFENCE_QUESTIONS_SYSTEM_PROMPT = `You are a senior practitioner interviewing a learner about a capstone project they just
submitted, in the style of a skeptical but fair technical interviewer / stakeholder. Read the capstone brief, their actual
submission (description, approach, decisions logged), and their real verification evidence (tests/security/accessibility/
performance/deployment/GitHub status), then write 3-5 adaptive follow-up questions that probe THIS specific submission — not
generic questions that would apply to any project. Reference their actual choices by name where possible.
Mix question types: at least one "why this over the alternative" question, one "what would break this at scale / in production"
question, one question about a specific tradeoff or decision they logged (skip this type if they logged none), and — if the
verification summary shows any FAIL or unresolved blocker — at least one question asking them to explain that specific
failure and what they'd do about it. If verification shows NOT_RUN items, you may ask why they haven't verified that yet,
but never imply or assume a NOT_RUN item failed OR passed.

Respond with strict JSON only, no markdown, in this exact shape:
{"questions": [{"question": "<the question>", "probes": "<one short phrase describing what this question is actually testing, e.g. 'tests whether they understand the cost tradeoff of their choice'>"}]}`;

function fallbackDefenceQuestions(): DefenceQuestion[] {
  return [
    {
      question: "Walk me through why you chose this overall approach instead of the most obvious alternative.",
      probes: "Tests whether the approach was a deliberate choice or the first thing that worked.",
    },
    {
      question: "Where would this break first if usage grew 10x, and what would you change to handle it?",
      probes: "Tests whether they've thought past the demo/happy path.",
    },
    {
      question: "What's the weakest part of what you built, and why didn't you fix it before submitting?",
      probes: "Tests self-awareness and honest scoping — a strong answer names a real gap.",
    },
  ];
}

export async function generateDefenceQuestions(input: {
  capstoneTitle: string;
  brief: string;
  requirements: string[];
  item: PortfolioItemRow;
  decisions: ProjectDecisionRow[];
  evidenceSummary: VerificationEvidenceSummary;
  userId?: string | null;
}): Promise<DefenceQuestion[]> {
  const project = projectContextFromItem(input.item);
  const result = await callAI({
    task: "capstone_defence_questions",
    userId: input.userId ?? null,
    messages: [
      { role: "system", content: DEFENCE_QUESTIONS_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          capstoneTitle: input.capstoneTitle,
          brief: input.brief,
          requirements: input.requirements,
          submission: project,
          decisionsLogged: decisionsToText(input.decisions),
        }),
      },
      { role: "system", content: input.evidenceSummary.promptBlock },
    ],
  });

  if (result) {
    try {
      const raw = result.content;
      const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as {
        questions: DefenceQuestion[];
      };
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) return parsed.questions;
    } catch {
      // fall through to fallback below
    }
  }
  return fallbackDefenceQuestions();
}

export interface CapstoneReviewResult {
  dimensionScores: Record<string, DimensionScore>;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  missing: string[];
  improvements: string[];
}

const REVIEW_SYSTEM_PROMPT = `You are a senior practitioner grading a capstone project submission for a professional
training platform (not a school — this is meant to be job-credible feedback). You'll get the capstone brief, the scoring
dimensions to use, the learner's submission, the decisions they logged, their answers to a defence interview, and a REAL
verification summary of their actual project (tests/security/accessibility/performance/deployment/GitHub status). Score each
given dimension from 0-100 with a one-sentence note explaining the score. Be honest and specific — do not inflate scores, do
not invent praise, and do not invent flaws that aren't supported by what they submitted. If defence answers reveal a
misunderstanding, that should lower the relevant dimension's score and show up in weaknesses.

The verification summary is evidence, not a separate score to average in — use it to ground and sanity-check the dimensions
you ARE scoring. Rules for using it:
- A FAIL in the verification summary (e.g. a failing security or accessibility check) must be reflected as a real weakness
  and must lower any dimension that claim relates to — never let confident-sounding defence answers override an actual FAIL.
- NOT_RUN means the learner never verified that dimension — treat it as unproven, not as passing, and do not silently assume
  it would have passed. If a scoring dimension is impossible to assess because everything relevant is NOT_RUN, say so
  explicitly in "missing" rather than guessing a score.
- GitHub NOT_CONNECTED means no repository evidence exists — never invent commits, PRs, or repo activity; if the brief
  implies real-world engineering practice, note the missing evidence in "missing" rather than penalizing invisibly.

Respond with strict JSON only, no markdown, in this exact shape:
{
  "dimensionScores": {"<dimension name exactly as given>": {"score": <0-100 integer>, "note": "<one sentence>"}},
  "overallFeedback": "<2-4 sentences, direct and specific to this submission>",
  "strengths": ["<specific strength, referencing what they actually did>"],
  "weaknesses": ["<specific weakness>"],
  "missing": ["<something the brief asked for that's absent or thin, including any NOT_RUN/NOT_CONNECTED evidence gaps>"],
  "improvements": ["<one concrete, actionable next step>"]
}
Keep each list to at most 4 items — fewer, sharper points beat padding.`;

export async function generateCapstoneReview(input: {
  capstoneTitle: string;
  brief: string;
  scoringDimensions: string[];
  item: PortfolioItemRow;
  decisions: ProjectDecisionRow[];
  defenceAnswers: DefenceAnswer[];
  evidenceSummary: VerificationEvidenceSummary;
  userId?: string | null;
}): Promise<CapstoneReviewResult | null> {
  const project = projectContextFromItem(input.item);
  const result = await callAI({
    task: "capstone_scoring",
    userId: input.userId ?? null,
    messages: [
      { role: "system", content: REVIEW_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          capstoneTitle: input.capstoneTitle,
          brief: input.brief,
          scoringDimensions: input.scoringDimensions,
          submission: project,
          decisionsLogged: decisionsToText(input.decisions),
          defenceAnswers: input.defenceAnswers,
        }),
      },
      { role: "system", content: input.evidenceSummary.promptBlock },
    ],
  });

  if (result) {
    try {
      const raw = result.content;
      const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as CapstoneReviewResult;
      if (parsed.dimensionScores && parsed.overallFeedback) return parsed;
    } catch {
      // fall through to null below
    }
  }
  // Unlike the monetisation plan's generic-but-safe fallback, a review's
  // dimension scores are specific claims about THIS submission — faking
  // them would be worse than admitting the AI call failed. The caller
  // surfaces this as "try again," never a fabricated score.
  return null;
}
