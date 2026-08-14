import "server-only";

import { callAI } from "@/lib/ai/router";
import { fetchRepoFileContent, getRawAccessToken } from "@/lib/github";

/**
 * Explain My Code + Debug This (brief sections 12/13). Both are grounded in
 * real source — the actual file content fetched from the learner's
 * connected GitHub repo, never invented — through the existing central AI
 * router only. Returns null (not a fabricated guess) when the file can't be
 * fetched, so the caller can surface an honest error.
 */

const EXPLAIN_SYSTEM_PROMPT = `You are a senior engineer explaining a real source file to a learner. You will be given the
file path and its actual content. Ground everything in what the code actually does — never invent behavior it doesn't
have. Respond with strict JSON only, no markdown, in this exact shape:
{
  "purpose": "<what this file/module is for, 2-3 sentences>",
  "dataFlow": "<how data moves through this file — inputs, transformations, outputs>",
  "dependencies": ["<real import/dependency named in the file>", "..."],
  "risks": ["<a real risk visible in this specific code, or empty array if genuinely none>"],
  "simplificationOpportunities": ["<a concrete simplification, or empty array if the code is already reasonably simple>"],
  "securityConcerns": ["<a real, specific security concern visible in this code, or empty array>"],
  "performanceConsiderations": ["<a real, specific performance note, or empty array>"]
}`;

export interface CodeExplanation {
  purpose: string;
  dataFlow: string;
  dependencies: string[];
  risks: string[];
  simplificationOpportunities: string[];
  securityConcerns: string[];
  performanceConsiderations: string[];
}

export async function explainCode(input: {
  userId: string;
  repoFullName: string;
  filePath: string;
}): Promise<{ explanation: CodeExplanation; fileContent: string } | { error: string }> {
  const token = await getRawAccessToken(input.userId);
  if (!token) return { error: "Connect GitHub first." };

  const content = await fetchRepoFileContent(token, input.repoFullName, input.filePath);
  if (!content) return { error: "Couldn't fetch that file — check the path and that the repo is accessible." };

  const result = await callAI({
    task: "code_explanation",
    userId: input.userId,
    messages: [
      { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
      { role: "user", content: `File: ${input.filePath}\n\n${content.slice(0, 20_000)}` },
    ],
  });

  if (!result) return { error: "The explanation engine is unavailable right now. Try again shortly." };

  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as CodeExplanation;
    if (!parsed.purpose || !parsed.dataFlow) throw new Error("incomplete");
    return { explanation: parsed, fileContent: content };
  } catch {
    return { error: "Couldn't parse an explanation for that file. Try again." };
  }
}

const DEBUG_SYSTEM_PROMPT = `You are a senior engineer pairing with a learner to debug a real error. You will be given
their error message/stack trace/logs, and optionally the content of a file they think is related. Debug systematically:
name the most likely cause grounded in what was actually given (not a generic guess), cite the specific evidence that
points to it, suggest concrete tests/diagnostic steps, and propose a fix. Prefer a guided, step-by-step diagnosis over
dumping a full file rewrite. Respond with strict JSON only, no markdown, in this exact shape:
{
  "likelyCauses": [{"cause": "<specific likely cause>", "evidence": "<what in the error/code points to this>"}],
  "testsToRun": ["<a concrete diagnostic step or test>", "..."],
  "proposedFix": "<a concrete, specific fix — reference actual code/lines if file content was given>",
  "explanation": "<2-4 sentences explaining why this happens>"
}`;

export interface DebugResult {
  likelyCauses: { cause: string; evidence: string }[];
  testsToRun: string[];
  proposedFix: string;
  explanation: string;
}

export async function debugThis(input: {
  userId: string;
  errorMessage: string;
  stackTrace?: string | null;
  logs?: string | null;
  repoFullName?: string | null;
  filePath?: string | null;
}): Promise<{ result: DebugResult } | { error: string }> {
  let fileContext = "";
  if (input.repoFullName && input.filePath) {
    const token = await getRawAccessToken(input.userId);
    if (token) {
      const content = await fetchRepoFileContent(token, input.repoFullName, input.filePath);
      if (content) fileContext = `Related file (${input.filePath}):\n${content.slice(0, 12_000)}`;
    }
  }

  const result = await callAI({
    task: "debug_assistance",
    userId: input.userId,
    messages: [
      { role: "system", content: DEBUG_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Error message: ${input.errorMessage}`,
          input.stackTrace ? `Stack trace:\n${input.stackTrace}` : "",
          input.logs ? `Logs:\n${input.logs}` : "",
          fileContext,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  if (!result) return { error: "The debug engine is unavailable right now. Try again shortly." };

  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as DebugResult;
    if (!Array.isArray(parsed.likelyCauses) || !parsed.proposedFix) throw new Error("incomplete");
    return { result: parsed };
  } catch {
    return { error: "Couldn't parse a debug response. Try again." };
  }
}
