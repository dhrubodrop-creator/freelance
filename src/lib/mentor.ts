import "server-only";

import { cerebras, CEREBRAS_MODEL } from "@/lib/cerebras";
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

const SYSTEM_PROMPT = `You are the Ropes AI mentor — a supportive, practical guide for students learning to build
AI no-code systems and go independent as freelancers. Answer using the provided course context when it's
relevant. Be concise, concrete, and encouraging without hype. If the context doesn't cover the question, say
so plainly and suggest the student use the "Request human help" option rather than guessing.`;

export async function answerMentorQuestion(params: {
  userId: string;
  courseId: string | null;
  message: string;
}): Promise<string> {
  const supabase = supabaseAdmin();

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

  const { data: historyData } = await supabase
    .from("mentor_messages")
    .select("*")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(10);
  const history = ((historyData ?? []) as MentorMessageRow[]).reverse();

  try {
    const completion = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(context ? [{ role: "system" as const, content: `Course context:\n${context}` }] : []),
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: params.message },
      ],
      temperature: 0.5,
    });
    return (
      completion.choices[0]?.message?.content ??
      "I couldn't put together an answer for that — try rephrasing, or request human help."
    );
  } catch {
    return "I'm having trouble reaching the mentor engine right now. Try again in a moment, or use \"Request human help\" below.";
  }
}
