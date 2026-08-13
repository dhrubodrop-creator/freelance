import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow, ProfileRow } from "@/types/db";

interface RecommendationResult {
  courseId: string | null;
  rationale: string;
}

const SYSTEM_PROMPT = `You are the path-matching engine for Ropes, a platform that teaches working
professionals to build AI no-code systems and go independent as freelancers or solo entrepreneurs.

You will be given a student's background and a catalog of real course tracks (each with a track
category and a description). Pick exactly one course whose track/description best fits their
background, using this as a primary heuristic, then refine with judgment:
- Sales, business development, or client-facing backgrounds → No-Code Automation (n8n / agent-building) track.
- Operations, DevOps, supply chain, logistics, or process-heavy backgrounds → AI Operations (MLOps/AIOps/LLMOps/DevOps) tracks.
- Developers or technically curious beginners with no clear specialization → Dev Tooling (e.g. Claude Code AI) as a starting point.
- Otherwise, match on genuine topical fit between their stated goals and the course descriptions.

Respond with strict JSON only, no markdown, in this exact shape:
{"track": "<track value from the catalog, copied exactly>", "rationale": "<2-3 sentence, second-person, specific to what they told you>"}`;

function fallbackTrack(profile: Pick<ProfileRow, "industry" | "occupation" | "career_goal">): string {
  const text = `${profile.industry ?? ""} ${profile.occupation ?? ""}`.toLowerCase();
  if (/sales|business development|account|marketing|client/.test(text)) return "No-Code Automation";
  if (/operations|supply chain|logistics|manufactur|process|devops/.test(text)) return "AI Operations";
  return "Dev Tooling";
}

export async function generateRecommendation(
  profile: Pick<ProfileRow, "occupation" | "years_experience" | "industry" | "career_goal" | "hours_per_week">,
  userId?: string | null
): Promise<RecommendationResult> {
  const supabase = supabaseAdmin();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, track, price")
    .order("price", { ascending: true });

  const catalog = (courses ?? []) as CourseRow[];

  const result = await callAI({
    task: "recommendation",
    userId: userId ?? null,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          student: profile,
          catalog: catalog.map((c) => ({ track: c.track, title: c.title, description: c.description })),
        }),
      },
    ],
  });

  if (result) {
    try {
      const raw = result.content;
      const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as {
        track: string;
        rationale: string;
      };
      const matched = catalog.find((c) => c.track === parsed.track) ?? catalog[0];
      return { courseId: matched?.id ?? null, rationale: parsed.rationale };
    } catch {
      // fall through to deterministic fallback below
    }
  }

  const track = fallbackTrack(profile);
  const matched = catalog.find((c) => c.track === track) ?? catalog[0];
  return {
    courseId: matched?.id ?? null,
    rationale:
      "Based on what you shared, this track lines up best with your background and available hours. Your AI mentor will help fine-tune this once you start.",
  };
}
