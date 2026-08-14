import "server-only";

import { callAI } from "@/lib/ai/router";
import { recordVerificationRun } from "@/lib/verification-runs";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectVerificationRunRow } from "@/types/db";

/**
 * Section 23 (AI Evaluation Studio) + 24 (Failure Replay). Evaluates a
 * learner's OWN AI feature (their system prompt + a test input for
 * something they're building), not Ropes' own AI Coach. `maxRetries: 1` on
 * the execution task deliberately, since retrying a learner's possibly-bad
 * prompt repeatedly wastes budget without new information — a genuine
 * failure should surface, not get silently retried away.
 */

const JUDGE_SYSTEM_PROMPT = `You are an evaluation judge for an AI feature a learner is building. You will be given
their test input, the AI output it actually produced, and what they expected. Judge honestly and specifically —
don't be generous. Respond with strict JSON only:
{
  "correctnessScore": <0-100>,
  "hallucinationRisk": "none" | "low" | "medium" | "high",
  "refusalQuality": "n/a" | "appropriate" | "over-refused" | "should-have-refused",
  "structuredOutputValid": true | false | null,
  "verdict": "pass" | "fail",
  "feedback": "<specific, grounded in the actual output>"
}`;

export interface AiEvalResult {
  featureName: string;
  systemPrompt: string;
  testInput: string;
  expectedBehavior: string;
  actualOutput: string;
  latencyMs: number;
  correctnessScore: number;
  hallucinationRisk: string;
  refusalQuality: string;
  structuredOutputValid: boolean | null;
  verdict: "pass" | "fail";
  feedback: string;
  runId?: string;
}

export async function runEvalCase(input: {
  userId: string;
  portfolioItemId?: string | null;
  featureName: string;
  systemPrompt: string;
  testInput: string;
  expectedBehavior: string;
}): Promise<AiEvalResult | { error: string }> {
  const started = Date.now();
  const execution = await callAI({
    task: "learner_ai_feature_execution",
    userId: input.userId,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.testInput },
    ],
  });
  const latencyMs = Date.now() - started;
  if (!execution) return { error: "Couldn't execute your feature's prompt right now." };

  const judge = await callAI({
    task: "ai_eval_judge",
    userId: input.userId,
    messages: [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ testInput: input.testInput, expectedBehavior: input.expectedBehavior, actualOutput: execution.content }),
      },
    ],
  });
  if (!judge) return { error: "The judge is unavailable right now." };

  try {
    const raw = judge.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (typeof parsed.correctnessScore !== "number" || !parsed.verdict) throw new Error("incomplete");

    const result: AiEvalResult = {
      featureName: input.featureName,
      systemPrompt: input.systemPrompt,
      testInput: input.testInput,
      expectedBehavior: input.expectedBehavior,
      actualOutput: execution.content,
      latencyMs,
      correctnessScore: parsed.correctnessScore,
      hallucinationRisk: parsed.hallucinationRisk,
      refusalQuality: parsed.refusalQuality,
      structuredOutputValid: parsed.structuredOutputValid,
      verdict: parsed.verdict,
      feedback: parsed.feedback,
    };

    const run = await recordVerificationRun({
      userId: input.userId,
      portfolioItemId: input.portfolioItemId,
      checkType: "ai_evaluation",
      inputSummary: `${input.featureName}: ${input.testInput.slice(0, 100)}`,
      results: result as unknown as Record<string, unknown>,
      score: result.correctnessScore,
      blockers: result.verdict === "fail" ? [result.feedback] : [],
    });
    result.runId = run?.id;

    return result;
  } catch {
    return { error: "Couldn't parse the evaluation. Try again." };
  }
}

export async function listEvalRuns(userId: string, portfolioItemId?: string, featureName?: string): Promise<ProjectVerificationRunRow[]> {
  const supabase = supabaseAdmin();
  let query = supabase.from("project_verification_runs").select("*").eq("user_id", userId).eq("check_type", "ai_evaluation");
  if (portfolioItemId) query = query.eq("portfolio_item_id", portfolioItemId);
  const { data } = await query.order("created_at", { ascending: false });
  const rows = (data ?? []) as ProjectVerificationRunRow[];
  if (!featureName) return rows;
  return rows.filter((r) => (r.results as { featureName?: string }).featureName === featureName);
}

/** Failure Replay: re-runs a failed eval case with the same inputs (optionally an edited prompt) and links the two runs. */
export async function replayFailedRun(input: {
  userId: string;
  originalRunId: string;
  updatedSystemPrompt?: string;
}): Promise<AiEvalResult | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: original } = await supabase
    .from("project_verification_runs")
    .select("*")
    .eq("id", input.originalRunId)
    .eq("user_id", input.userId)
    .eq("check_type", "ai_evaluation")
    .maybeSingle();
  if (!original) return { error: "Original run not found." };

  const originalResults = original.results as unknown as AiEvalResult;
  const rerun = await runEvalCase({
    userId: input.userId,
    portfolioItemId: original.portfolio_item_id,
    featureName: originalResults.featureName,
    systemPrompt: input.updatedSystemPrompt ?? originalResults.systemPrompt,
    testInput: originalResults.testInput,
    expectedBehavior: originalResults.expectedBehavior,
  });
  if ("error" in rerun) return rerun;

  await recordVerificationRun({
    userId: input.userId,
    portfolioItemId: original.portfolio_item_id,
    checkType: "failure_replay",
    inputSummary: `Replay of ${input.originalRunId}`,
    results: { originalRunId: input.originalRunId, newVerdict: rerun.verdict, resolved: rerun.verdict === "pass" },
  });

  return rerun;
}
