import "server-only";

import { callAI } from "@/lib/ai/router";
import type { PortfolioItemRow, ProjectDecisionRow } from "@/types/db";

const SYSTEM_PROMPT = `You write portfolio case studies for a professional training platform. You will be given a
learner's real project data: title, description, problem, solution, outcome, tools used, and the decisions they logged.
Turn ONLY the facts given into four pieces of content. Never invent metrics, outcomes, client names, dates, or results
that aren't in the input — if the outcome is thin or missing, write around that honestly rather than fabricating one.

Respond with strict JSON only, no markdown, in this exact shape:
{
  "caseStudy": "<3-5 paragraph case study: problem, approach, key decisions and why, outcome, written in first person past tense, professional but not corporate-jargon-y>",
  "shortVersion": "<2-3 sentences, the version that fits in a portfolio card or LinkedIn post>",
  "resumeBullets": ["<action-verb-led resume bullet, quantified only if the input gives real numbers>", "..."],
  "interviewStory": "<a spoken-style STAR-format answer (Situation/Task/Action/Result) they could actually say out loud in an interview when asked 'tell me about a project you built'>"
}
2-4 resume bullets. Ground every claim in the given input — if you're unsure whether something is true, leave it out.`;

export interface PortfolioGenerationResult {
  caseStudy: string;
  shortVersion: string;
  resumeBullets: string[];
  interviewStory: string;
}

export async function generatePortfolioCaseStudy(input: {
  item: PortfolioItemRow;
  decisions: ProjectDecisionRow[];
  skillNames: string[];
  userId?: string | null;
}): Promise<PortfolioGenerationResult | null> {
  const result = await callAI({
    task: "portfolio_generation",
    userId: input.userId ?? null,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          title: input.item.title,
          description: input.item.description,
          problem: input.item.problem,
          solution: input.item.solution,
          outcome: input.item.outcome,
          toolsUsed: input.item.tools_used,
          skillsDemonstrated: input.skillNames,
          decisions: input.decisions.map((d) => ({
            decision: d.decision,
            alternatives: d.alternatives,
            reasoning: d.reasoning,
            tradeoff: d.tradeoff,
          })),
        }),
      },
    ],
  });

  if (!result) return null;
  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as PortfolioGenerationResult;
    if (!parsed.caseStudy || !parsed.shortVersion || !Array.isArray(parsed.resumeBullets)) return null;
    return parsed;
  } catch {
    return null;
  }
}
