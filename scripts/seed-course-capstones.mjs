// Post-audit P1 fix: only 3/21 courses had a capstone. This drafts a
// course-specific capstone brief for every course that doesn't have one
// yet, grounded in that course's REAL modules/build_deliverables/topics/
// skills (never a copy-pasted generic template), via the same Cerebras
// provider the live app uses (called directly here since this is offline
// content seeding, not a runtime request — same convention as
// scripts/generate_playbooks.py's offline generation pass).
//
// Idempotent: only inserts for courses with zero existing course_capstones
// row. Safe to re-run.
//
// Usage: node scripts/seed-course-capstones.mjs        (dry run, prints drafts)
//        node scripts/seed-course-capstones.mjs --apply (writes to DB)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import ws from "ws";

const APPLY = process.argv.includes("--apply");

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

const SYSTEM_PROMPT = `You write a capstone brief for a professional AI/automation training course, grounded ONLY in
the real course content given to you (module titles, what each module builds, topics, and the skills it teaches). The
capstone must require the learner to defend something that plausibly follows from THIS course's actual modules — not a
generic "build an app" brief that could apply to any course. Do not invent tools/technologies the modules don't teach.

Respond with strict JSON only, no markdown, in this exact shape:
{
  "title": "<short capstone title specific to this course>",
  "brief": "<3-5 sentences: the real-world problem, why it matters, what the learner must build, grounded in the course's actual modules>",
  "requirements": ["<concrete requirement tied to a specific module's build_deliverable or topic>"],
  "scoringDimensions": ["<3-5 short dimension names, e.g. 'Technical implementation', 'Architecture reasoning', 'Production readiness'>"]
}
Provide 4-6 requirements. Keep scoringDimensions to 3-5 items.`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function draftCapstone(course, modules, skillNames) {
  const moduleSummary = modules
    .map((m, i) => `${i + 1}. ${m.title}${m.build_deliverable ? ` — builds: ${m.build_deliverable}` : ""}${m.outcome ? ` — outcome: ${m.outcome}` : ""}`)
    .join("\n");

  let lastError;
  for (let attempt = 0; attempt <= 5; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(3000 * 2 ** (attempt - 1), 30_000);
      console.log(`  retrying ${course.slug} in ${backoff}ms (attempt ${attempt + 1})...`);
      await sleep(backoff);
    }
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CEREBRAS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.CEREBRAS_MODEL || "gpt-oss-120b",
        temperature: 0.4,
        max_tokens: 1400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              courseTitle: course.title,
              courseDescription: course.description,
              modules: moduleSummary,
              skillsTaught: skillNames,
            }),
          },
        ],
      }),
    });
    if (res.status === 429 || res.status >= 500) {
      lastError = new Error(`Cerebras API error ${res.status}`);
      continue;
    }
    if (!res.ok) throw new Error(`Cerebras API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (!parsed.title || !parsed.brief || !Array.isArray(parsed.requirements) || !Array.isArray(parsed.scoringDimensions)) {
      throw new Error(`Malformed capstone draft for ${course.slug}`);
    }
    return parsed;
  }
  throw lastError;
}

async function main() {
  const { data: courses } = await supabase.from("courses").select("id, slug, title, description").order("title");
  const { data: existingCapstones } = await supabase.from("course_capstones").select("course_id");
  const existingCourseIds = new Set((existingCapstones ?? []).map((c) => c.course_id));

  const coursesNeedingCapstone = (courses ?? []).filter((c) => !existingCourseIds.has(c.id));
  console.log(`${coursesNeedingCapstone.length} courses need a capstone (of ${(courses ?? []).length} total).`);

  const results = [];
  for (const course of coursesNeedingCapstone) {
    const { data: modules } = await supabase
      .from("modules")
      .select("id, title, build_deliverable, outcome, topics")
      .eq("course_id", course.id)
      .order("order_index");
    if (!modules || modules.length === 0) {
      console.warn(`SKIP ${course.slug}: no modules found`);
      continue;
    }
    const moduleIds = modules.map((m) => m.id);
    const { data: moduleSkillRows } = await supabase.from("module_skills").select("skill_id").in("module_id", moduleIds);
    const skillIds = Array.from(new Set((moduleSkillRows ?? []).map((r) => r.skill_id)));
    const { data: skillRows } = skillIds.length > 0 ? await supabase.from("skills").select("name").in("id", skillIds) : { data: [] };
    const skillNames = (skillRows ?? []).map((s) => s.name);

    try {
      const draft = await draftCapstone(course, modules, skillNames);
      results.push({ course, draft });
      console.log(`\n=== ${course.slug} ===`);
      console.log(JSON.stringify(draft, null, 2));
    } catch (e) {
      console.error(`FAILED ${course.slug}: ${e.message}`);
    }
    await sleep(4000); // stay well under the per-minute rate limit
  }

  console.log(`\nDrafted ${results.length}/${coursesNeedingCapstone.length}.`);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to insert.");
    return;
  }

  for (const { course, draft } of results) {
    const { error } = await supabase.from("course_capstones").insert({
      course_id: course.id,
      title: draft.title,
      brief: draft.brief,
      requirements: draft.requirements,
      scoring_dimensions: draft.scoringDimensions,
    });
    if (error) {
      console.error(`INSERT FAILED ${course.slug}: ${error.message}`);
    } else {
      console.log(`Inserted capstone for ${course.slug}`);
    }
  }
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e);
  process.exit(1);
});
