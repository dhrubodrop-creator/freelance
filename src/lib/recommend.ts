import "server-only";

import { cerebras, CEREBRAS_MODEL } from "@/lib/cerebras";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow, ProfileRow } from "@/types/db";

interface RecommendationResult {
  courseId: string | null;
  rationale: string;
}

const SYSTEM_PROMPT = `You are the path-matching engine for Ropes, a platform that teaches working
professionals to build AI no-code systems and go independent as freelancers.

You will be given a student's background and a catalog of course tracks. Match them to exactly
one track using this logic as your primary heuristic, then refine with judgment:
- Sales, business development, or client-facing backgrounds → the outreach / lead-generation agent track.
- Operations, supply chain, logistics, or process-heavy backgrounds → the process automation track.
- Unclear, early-career, underemployed, or no clearly transferable background → the foundational no-code starter track.

Respond with strict JSON only, no markdown, in this exact shape:
{"track": "<track slug from the catalog>", "rationale": "<2-3 sentence, second-person, specific to what they told you>"}`;

function fallbackTrack(profile: Pick<ProfileRow, "industry" | "occupation" | "career_goal">): string {
  const text = `${profile.industry ?? ""} ${profile.occupation ?? ""}`.toLowerCase();
  if (/sales|business development|account|marketing|client/.test(text)) return "outreach";
  if (/operations|supply chain|logistics|manufactur|process/.test(text)) return "automation";
  return "foundations";
}

export async function generateRecommendation(
  profile: Pick<ProfileRow, "occupation" | "years_experience" | "industry" | "career_goal" | "hours_per_week">
): Promise<RecommendationResult> {
  const supabase = supabaseAdmin();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, track, price")
    .order("price", { ascending: true });

  const catalog = (courses ?? []) as CourseRow[];

  try {
    const completion = await cerebras.chat.completions.create({
      model: CEREBRAS_MODEL,
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
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as {
      track: string;
      rationale: string;
    };
    const matched = catalog.find((c) => c.track === parsed.track) ?? catalog[0];
    return { courseId: matched?.id ?? null, rationale: parsed.rationale };
  } catch {
    const track = fallbackTrack(profile);
    const matched = catalog.find((c) => c.track === track) ?? catalog[0];
    return {
      courseId: matched?.id ?? null,
      rationale:
        "Based on what you shared, this track lines up best with your background and available hours. Your AI mentor will help fine-tune this once you start.",
    };
  }
}
