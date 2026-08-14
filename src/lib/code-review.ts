import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchRepoFileContent, getRawAccessToken } from "@/lib/github";
import { recordVerificationRun } from "@/lib/verification-runs";

/**
 * Section 14 (Review Before Commit), 15 (Architecture Guardian), 16
 * (AI-generated code defense). All three are grounded in real input the
 * learner actually pasted/fetched — never a claim of having reviewed code
 * that wasn't actually inspected.
 */

const REVIEW_SYSTEM_PROMPT = `You are a senior engineer reviewing a real code diff before it's committed. You will be given
the diff. Only comment on what's actually in the diff — never invent issues that aren't there, and say so plainly if the
diff is too small to say much about. Watch specifically for suspicious AI-generated patterns: overly generic variable
names, unused abstractions, comments that just restate the code, error handling that swallows errors silently.
Respond with strict JSON only, no markdown, in this exact shape:
{
  "findings": [{"category": "bug" | "edge_case" | "naming" | "maintainability" | "accessibility" | "security" | "performance" | "unnecessary_complexity" | "ai_pattern", "summary": "<specific finding>", "severity": "low" | "medium" | "high"}],
  "overallAssessment": "<2-3 sentences>"
}
Return an empty findings array if the diff is genuinely clean — do not pad with invented nitpicks.`;

export interface CodeReviewResult {
  findings: { category: string; summary: string; severity: "low" | "medium" | "high" }[];
  overallAssessment: string;
}

export async function reviewDiff(input: {
  userId: string;
  portfolioItemId?: string | null;
  diff: string;
}): Promise<CodeReviewResult | null> {
  const result = await callAI({
    task: "code_review",
    userId: input.userId,
    messages: [
      { role: "system", content: REVIEW_SYSTEM_PROMPT },
      { role: "user", content: input.diff.slice(0, 20_000) },
    ],
  });
  if (!result) return null;

  let parsed: CodeReviewResult | null = null;
  try {
    const raw = result.content;
    const candidate = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (Array.isArray(candidate.findings) && candidate.overallAssessment) parsed = candidate;
  } catch {
    parsed = null;
  }
  if (!parsed) return null;

  const highCount = parsed.findings.filter((f) => f.severity === "high").length;
  await recordVerificationRun({
    userId: input.userId,
    portfolioItemId: input.portfolioItemId,
    checkType: "code_review",
    inputSummary: `Diff review (${input.diff.length} chars)`,
    results: parsed as unknown as Record<string, unknown>,
    score: Math.max(0, 100 - parsed.findings.length * 10),
    blockers: parsed.findings.filter((f) => f.severity === "high").map((f) => f.summary),
  });
  void highCount;

  return parsed;
}

const ARCHITECTURE_DRIFT_SYSTEM_PROMPT = `You are reviewing whether a project's actual file structure has drifted from
its approved architecture description. You will be given the approved architecture text and the current repo's file
list. Identify only real, meaningful drift (wrong data layer, duplicated service, an unauthorized-looking API access
pattern, an unnecessary dependency implied by file names, inconsistent structure) — not superficial differences.
Respond with strict JSON only, no markdown, in this exact shape:
{
  "drifted": true or false,
  "whatChanged": "<specific, grounded in the actual file list>",
  "whyItMatters": "<concrete consequence>",
  "whatCouldBreak": "<concrete risk, or empty string if low risk>",
  "recommendedAction": "<one concrete next step>"
}
If there's no meaningful drift, set drifted to false and keep the other fields short.`;

export interface ArchitectureDriftResult {
  drifted: boolean;
  whatChanged: string;
  whyItMatters: string;
  whatCouldBreak: string;
  recommendedAction: string;
}

export async function checkArchitectureDrift(input: {
  userId: string;
  portfolioItemId: string;
  repoFullName: string;
}): Promise<ArchitectureDriftResult | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("architecture_note")
    .eq("id", input.portfolioItemId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!item) return { error: "Project not found." };

  let approvedArchitecture = item.architecture_note;
  if (!approvedArchitecture) {
    const { data: plan } = await supabase
      .from("project_idea_plans")
      .select("architecture_proposal")
      .eq("portfolio_item_id", input.portfolioItemId)
      .maybeSingle();
    approvedArchitecture = plan?.architecture_proposal ?? null;
  }
  if (!approvedArchitecture) {
    return { error: "No approved architecture is recorded for this project yet — set one first." };
  }

  const token = await getRawAccessToken(input.userId);
  if (!token) return { error: "Connect GitHub first." };

  const treeRes = await fetch(`https://api.github.com/repos/${input.repoFullName}/git/trees/HEAD?recursive=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!treeRes.ok) return { error: "Couldn't read the repo's file structure." };
  const treeData = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
  const filePaths = (treeData.tree ?? []).filter((t) => t.type === "blob").map((t) => t.path).slice(0, 500);

  const result = await callAI({
    task: "architecture_drift_check",
    userId: input.userId,
    messages: [
      { role: "system", content: ARCHITECTURE_DRIFT_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ approvedArchitecture, currentFileList: filePaths }),
      },
    ],
  });
  if (!result) return { error: "The architecture check engine is unavailable right now." };

  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as ArchitectureDriftResult;
    if (typeof parsed.drifted !== "boolean") throw new Error("incomplete");

    await recordVerificationRun({
      userId: input.userId,
      portfolioItemId: input.portfolioItemId,
      checkType: "architecture_drift",
      inputSummary: `Checked ${filePaths.length} files against approved architecture`,
      results: parsed as unknown as Record<string, unknown>,
      blockers: parsed.drifted ? [parsed.whatChanged] : [],
    });

    return parsed;
  } catch {
    return { error: "Couldn't parse the architecture check. Try again." };
  }
}

const DEFENSE_QUESTIONS_PROMPT = `You are asking a learner to defend code (possibly AI-assisted) they submitted. You
cannot reliably determine whether code was AI-generated — don't claim to. Instead, generate 3-4 pointed questions that
only someone who genuinely understands this specific code could answer well. Base every question on the actual diff
given. Respond with strict JSON only: {"questions": ["<question 1>", "..."]}`;

const DEFENSE_EVALUATION_PROMPT = `You are evaluating a learner's answers to code-defense questions about their own
diff. Judge whether their answers demonstrate real understanding of THIS code, not generic knowledge. Respond with
strict JSON only: {"understood": true or false, "feedback": "<specific feedback tied to their actual answers>"}`;

export async function generateAiCodeDefenseQuestions(input: {
  userId: string;
  portfolioItemId?: string | null;
  diff: string;
}): Promise<string[] | null> {
  const result = await callAI({
    task: "ai_code_defense",
    userId: input.userId,
    messages: [
      { role: "system", content: DEFENSE_QUESTIONS_PROMPT },
      { role: "user", content: input.diff.slice(0, 12_000) },
    ],
  });
  if (!result) return null;
  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    return Array.isArray(parsed.questions) ? parsed.questions : null;
  } catch {
    return null;
  }
}

export async function evaluateAiCodeDefense(input: {
  userId: string;
  portfolioItemId?: string | null;
  diff: string;
  questions: string[];
  answers: string[];
}): Promise<{ understood: boolean; feedback: string } | null> {
  const result = await callAI({
    task: "ai_code_defense",
    userId: input.userId,
    messages: [
      { role: "system", content: DEFENSE_EVALUATION_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          diff: input.diff.slice(0, 8000),
          qa: input.questions.map((q, i) => ({ question: q, answer: input.answers[i] ?? "" })),
        }),
      },
    ],
  });
  if (!result) return null;
  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (typeof parsed.understood !== "boolean") return null;

    await recordVerificationRun({
      userId: input.userId,
      portfolioItemId: input.portfolioItemId,
      checkType: "code_review",
      inputSummary: "AI-code defense session",
      results: { kind: "ai_code_defense", questions: input.questions, answers: input.answers, ...parsed },
      score: parsed.understood ? 100 : 40,
    });

    return parsed;
  } catch {
    return null;
  }
}

export async function fetchFileForReview(userId: string, repoFullName: string, filePath: string): Promise<string | null> {
  const token = await getRawAccessToken(userId);
  if (!token) return null;
  return fetchRepoFileContent(token, repoFullName, filePath);
}
