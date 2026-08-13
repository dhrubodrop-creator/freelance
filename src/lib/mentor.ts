import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ContentChunkRow, MentorMessageRow } from "@/types/db";

const RATE_LIMIT_MAX_PER_MINUTE = 8;

export async function isRateLimited(userId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("mentor_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", oneMinuteAgo);
  return (count ?? 0) >= RATE_LIMIT_MAX_PER_MINUTE;
}

/**
 * The AI mentor became the AI Coach: instead of one generic chat mode, the
 * learner picks what they actually want from this turn — the same coach,
 * different job. Each mode is a distinct instruction layered on the base
 * system prompt, not a different model/provider — the routing that matters
 * here is task complexity (handled by src/lib/ai/router.ts's per-task
 * config), not per-mode model selection, since there's one model configured
 * today.
 */
export type CoachMode =
  | "explain"
  | "hint"
  | "socratic"
  | "debug"
  | "review"
  | "challenge"
  | "interview"
  | "career"
  | "next_step";

export const COACH_MODE_LABEL: Record<CoachMode, string> = {
  explain: "Explain",
  hint: "Hint",
  socratic: "Socratic",
  debug: "Debug",
  review: "Review",
  challenge: "Challenge",
  interview: "Interview",
  career: "Career",
  next_step: "Next step",
};

export const COACH_MODE_DESCRIPTION: Record<CoachMode, string> = {
  explain: "Get a direct, concrete explanation.",
  hint: "Get a nudge, not the answer.",
  socratic: "Get asked a question first, so you reason it out.",
  debug: "Debug systematically, one step at a time.",
  review: "Get your approach reviewed like a senior practitioner would.",
  challenge: "Get pushed with a harder variant or edge case.",
  interview: "Get a follow-up question the way a real interviewer would ask it.",
  career: "Get the answer tied to your actual career goal.",
  next_step: "Get told the single most useful thing to do next.",
};

const MODE_INSTRUCTION: Record<CoachMode, string> = {
  explain:
    "Mode: EXPLAIN. Give a direct, clear explanation with a concrete example tied to the course content. Don't hedge or make them guess.",
  hint: "Mode: HINT. Do not give the full answer. Give one nudge that moves them a step closer without solving it for them.",
  socratic:
    "Mode: SOCRATIC. Do not give the answer immediately. Ask exactly one probing question that makes them reason it out based on what they've said, referencing their specific situation. Only give the full explanation if they say they're stuck or ask directly for the answer.",
  debug:
    "Mode: DEBUG. Help them debug systematically like a senior engineer pairing with them: ask what they've already tried if they haven't said, name the most likely cause given what they've described, and suggest exactly one concrete diagnostic step — not a list of every possible fix.",
  review:
    "Mode: REVIEW. Respond like a senior practitioner reviewing a colleague's approach: name one thing that's strong, one thing that's weak, and one concrete improvement. Be specific, not generic praise.",
  challenge:
    "Mode: CHALLENGE. Push them harder than a normal answer would: pose a harder variant of their question or an edge case they likely haven't considered, and ask them to reason about it.",
  interview:
    "Mode: INTERVIEW. Respond like a real technical interviewer: ask one follow-up question that probes the depth of their understanding, the way a real interview would, based on what they just said.",
  career:
    "Mode: CAREER. Answer with their stated career goal in mind (check user context below) — connect your answer to how it helps them get hired or paid, not just the concept in isolation.",
  next_step:
    "Mode: NEXT STEP. After answering briefly, end by naming the single most useful next action they should take in this course right now.",
};

const BASE_SYSTEM_PROMPT = `You are the Ropes AI Coach — a supportive, practical guide for students learning to build
AI/no-code systems and go independent as freelancers. Answer using the provided course context when it's relevant. Be
concise, concrete, and encouraging without hype. If the context doesn't cover the question, say so plainly and suggest the
student use the "Request human help" option rather than guessing.`;

export async function answerMentorQuestion(params: {
  userId: string;
  courseId: string | null;
  moduleId?: string | null;
  message: string;
  mode?: CoachMode;
  careerGoal?: string | null;
}): Promise<string> {
  const supabase = supabaseAdmin();
  const mode = params.mode ?? "explain";

  let context = "";
  if (params.courseId) {
    const { data } = await supabase.rpc("match_content_chunks", {
      query_text: params.message,
      p_course_id: params.courseId,
      match_count: 5,
    });
    const chunks = (data ?? []) as Pick<ContentChunkRow, "content" | "source_type">[];
    if (chunks.length > 0) {
      context = chunks.map((c) => `[${c.source_type}] ${c.content}`).join("\n\n");
    }
  }

  // Hierarchical context (course -> module): tells the coach exactly what
  // screen the learner is on, not just which course, so "explain this"
  // resolves to the right lesson instead of a course-wide guess.
  let moduleContext = "";
  if (params.moduleId) {
    const { data: moduleRow } = await supabase
      .from("modules")
      .select("title, topics, build_deliverable, outcome")
      .eq("id", params.moduleId)
      .maybeSingle();
    if (moduleRow) {
      const parts = [`Module: ${moduleRow.title}`];
      if (moduleRow.topics?.length) parts.push(`Topics: ${moduleRow.topics.join(", ")}`);
      if (moduleRow.build_deliverable) parts.push(`Build: ${moduleRow.build_deliverable}`);
      moduleContext = parts.join("\n");
    }
  }

  const { data: historyData } = await supabase
    .from("mentor_messages")
    .select("*")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(10);
  const history = ((historyData ?? []) as MentorMessageRow[]).reverse();

  const systemContent = [BASE_SYSTEM_PROMPT, MODE_INSTRUCTION[mode]].join("\n\n");
  const contextMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemContent },
  ];
  if (moduleContext) contextMessages.push({ role: "system", content: `Learner's current module:\n${moduleContext}` });
  if (context) contextMessages.push({ role: "system", content: `Course context:\n${context}` });
  if (params.careerGoal) {
    contextMessages.push({ role: "system", content: `User's stated career goal: ${params.careerGoal}` });
  }

  const result = await callAI({
    task: mode === "socratic" ? "socratic_questioning" : mode === "hint" ? "hint_generation" : "lesson_explanation",
    userId: params.userId,
    messages: [
      ...contextMessages,
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: params.message },
    ],
  });

  return (
    result?.content ??
    "I'm having trouble reaching the mentor engine right now. Try again in a moment, or use \"Request human help\" below."
  );
}
