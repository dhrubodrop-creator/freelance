import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ConceptRescueRequestRow } from "@/types/db";

/**
 * "I don't understand" — Instant Concept Rescue. Grounded in the actual
 * module's content (same module-context pattern as src/lib/mentor.ts),
 * through the existing central AI router only. Returns a structured
 * 5-part explanation; a deterministic fallback covers an AI/parse failure
 * so the learner never sees a blank rescue.
 */

const SYSTEM_PROMPT = `You are the Ropes AI Coach's "I don't understand" rescue mode. A learner is stuck on a specific
module and asked for help. Use the provided module context (and their optional specific question) to produce a rescue
package that gets them unstuck fast. Respond with strict JSON only, no markdown, in this exact shape:
{
  "simpleExplanation": "<plain, direct explanation in 2-4 sentences, no jargon unless defined>",
  "visualExample": "<describe a concrete example or scenario that makes it visual/tangible, 2-4 sentences>",
  "analogy": "<one relatable analogy, 1-3 sentences>",
  "codeExample": "<a short, real, working code/config example if the concept is technical, else empty string>",
  "fiveMinutePractice": "<one small, doable-in-5-minutes practice task tied to this exact concept>"
}`;

interface RescueResult {
  simpleExplanation: string;
  visualExample: string;
  analogy: string;
  codeExample: string;
  fiveMinutePractice: string;
}

function fallbackRescue(moduleTitle: string, topics: string[]): RescueResult {
  const topicList = topics.length ? topics.join(", ") : moduleTitle;
  return {
    simpleExplanation: `This module (${moduleTitle}) covers: ${topicList}. Re-read the module content once, then re-watch the specific section that lost you — most confusion here comes from one skipped step, not the whole topic.`,
    visualExample: `Picture the concrete deliverable this module asks you to build (${moduleTitle}) and walk through it step by step on paper before touching the tool.`,
    analogy: `Think of it like learning to drive before understanding every part of the engine — you can operate it correctly first, and the deeper "why" clicks once you've done it once.`,
    codeExample: "",
    fiveMinutePractice: "Re-do the smallest exercise in this module's Practice tab from scratch, without looking at your previous attempt.",
  };
}

export async function generateConceptRescue(input: {
  userId: string;
  moduleId: string;
  exerciseId?: string | null;
  question?: string | null;
}): Promise<ConceptRescueRequestRow | null> {
  const supabase = supabaseAdmin();

  const { data: moduleRow } = await supabase
    .from("modules")
    .select("title, topics, build_deliverable, outcome")
    .eq("id", input.moduleId)
    .maybeSingle();
  if (!moduleRow) return null;

  const { data: sectionRows } = await supabase
    .from("module_playbook_sections")
    .select("title, content")
    .eq("module_id", input.moduleId)
    .in("section_type", ["mental_models", "workflow", "failure_modes"])
    .order("order_index");

  let exerciseContext = "";
  if (input.exerciseId) {
    const { data: exercise } = await supabase
      .from("exercises")
      .select("title, problem_statement")
      .eq("id", input.exerciseId)
      .maybeSingle();
    if (exercise) exerciseContext = `Exercise the learner is stuck on: ${exercise.title} — ${exercise.problem_statement}`;
  }

  const contextParts = [
    `Module: ${moduleRow.title}`,
    moduleRow.topics?.length ? `Topics: ${moduleRow.topics.join(", ")}` : "",
    moduleRow.build_deliverable ? `Build: ${moduleRow.build_deliverable}` : "",
    exerciseContext,
    ...(sectionRows ?? []).map((s) => `${s.title}: ${s.content.slice(0, 1200)}`),
  ].filter(Boolean);

  const result = await callAI({
    task: "concept_rescue",
    userId: input.userId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextParts.join("\n\n") },
      { role: "user", content: input.question?.trim() || "I don't understand this module. Help me get unstuck." },
    ],
  });

  let parsed: RescueResult | null = null;
  if (result) {
    try {
      const raw = result.content;
      const candidate = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      if (candidate.simpleExplanation && candidate.visualExample && candidate.analogy && candidate.fiveMinutePractice) {
        parsed = {
          simpleExplanation: String(candidate.simpleExplanation),
          visualExample: String(candidate.visualExample),
          analogy: String(candidate.analogy),
          codeExample: candidate.codeExample ? String(candidate.codeExample) : "",
          fiveMinutePractice: String(candidate.fiveMinutePractice),
        };
      }
    } catch {
      parsed = null;
    }
  }
  const rescue = parsed ?? fallbackRescue(moduleRow.title, moduleRow.topics ?? []);

  const { data: inserted, error } = await supabase
    .from("concept_rescue_requests")
    .insert({
      user_id: input.userId,
      module_id: input.moduleId,
      exercise_id: input.exerciseId ?? null,
      question: input.question ?? null,
      simple_explanation: rescue.simpleExplanation,
      visual_example: rescue.visualExample,
      analogy: rescue.analogy,
      code_example: rescue.codeExample || null,
      five_minute_practice: rescue.fiveMinutePractice,
    })
    .select("*")
    .single();

  if (error) return null;
  return inserted as ConceptRescueRequestRow;
}
