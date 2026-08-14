import "server-only";

import { callAI } from "@/lib/ai/router";
import { fetchRepoFileContent, getRawAccessToken } from "@/lib/github";
import { recordVerificationRun } from "@/lib/verification-runs";

/**
 * Section 18 — Automated Test Generator. Derives real test code from actual
 * acceptance criteria and (when available) actual fetched file content —
 * never a test that just re-asserts whatever the code currently does. The
 * generated code is returned as text for the learner to add to their own
 * repo; it is never executed on the Ropes server (brief's security
 * principle against running learner code server-side).
 */

const SYSTEM_PROMPT = `You are generating real, runnable test code for a learner's project, derived from their actual
acceptance criteria and (if given) actual source file content. Tests must validate the stated REQUIREMENTS, not just
assert whatever the current code happens to return — a test that always passes regardless of correctness is useless
and you must not write one. Use Vitest/Jest-style syntax unless the file content clearly indicates a different
framework already in use. Respond with strict JSON only, no markdown:
{
  "framework": "<framework name used>",
  "testCode": "<complete, real test file content>",
  "notes": "<1-2 sentences on what's covered and what still needs a human/manual check>"
}`;

export interface GeneratedTests {
  framework: string;
  testCode: string;
  notes: string;
}

export async function generateTests(input: {
  userId: string;
  portfolioItemId?: string | null;
  acceptanceCriteria: string[];
  repoFullName?: string | null;
  filePath?: string | null;
}): Promise<GeneratedTests | { error: string }> {
  if (input.acceptanceCriteria.length === 0) {
    return { error: "Add at least one acceptance criterion first — tests are generated from real requirements, not guessed." };
  }

  let fileContext = "";
  if (input.repoFullName && input.filePath) {
    const token = await getRawAccessToken(input.userId);
    if (token) {
      const content = await fetchRepoFileContent(token, input.repoFullName, input.filePath);
      if (content) fileContext = `Source file (${input.filePath}):\n${content.slice(0, 15_000)}`;
    }
  }

  const result = await callAI({
    task: "test_generation",
    userId: input.userId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [`Acceptance criteria:\n${input.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`, fileContext]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });
  if (!result) return { error: "The test generator is unavailable right now. Try again shortly." };

  try {
    const raw = result.content;
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as GeneratedTests;
    if (!parsed.testCode || !parsed.framework) throw new Error("incomplete");

    await recordVerificationRun({
      userId: input.userId,
      portfolioItemId: input.portfolioItemId,
      checkType: "test_generation",
      inputSummary: `Generated tests from ${input.acceptanceCriteria.length} acceptance criteria`,
      results: parsed as unknown as Record<string, unknown>,
    });

    return parsed;
  } catch {
    return { error: "Couldn't parse generated tests. Try again." };
  }
}
