// Targeted, safe video_url fixes for modules mechanically confirmed to share an
// unrelated placeholder video (see MOBILE_AUDIT_REPORT-adjacent video-duplicate audit).
// Every replacement URL below was found via a real web search and verified via a real
// fetch (confirmed the YouTube page resolves and its <title> matches the expected topic)
// before being used here — none are invented. Only touches `modules.video_url`; never
// touches courses/pricing/enrollments/any other table.
//
// Usage: node scripts/fix-placeholder-videos.mjs        (dry run, prints diff)
//        node scripts/fix-placeholder-videos.mjs --apply (writes to DB)

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

// Each entry: real module id (queried directly, not guessed) -> a real, verified video URL.
const FIXES = [
  {
    moduleId: "f1e9bb04-90be-4552-a457-05c169a31545",
    module: "RAG & Grounding",
    course: "Generative AI (GenAI)",
    newUrl: "https://www.youtube.com/watch?v=vT-DpLvf29Q",
    newTitle: "Complete RAG Tutorial 2026 (Free Labs)",
    reason: "Was the 20-course cross-topic placeholder. This is a real, current RAG tutorial matching the module's actual objective.",
  },
  {
    moduleId: "8495ecdf-0003-4836-9a53-34005ef987d0",
    module: "RAG for Analytics",
    course: "Data Science with Generative AI",
    newUrl: "https://www.youtube.com/watch?v=vT-DpLvf29Q",
    newTitle: "Complete RAG Tutorial 2026 (Free Labs)",
    reason: "Same placeholder issue — RAG fundamentals video is a genuine prerequisite match; the analytics-specific application still needs a follow-up module-specific resource (see REVIEW_REQUIRED).",
  },
  {
    moduleId: "2844e4ce-1010-49a0-8db0-d4f2badaa7fa",
    module: "RAG & Deployment",
    course: "GCP AI",
    newUrl: "https://www.youtube.com/watch?v=vT-DpLvf29Q",
    newTitle: "Complete RAG Tutorial 2026 (Free Labs)",
    reason: "Partial match only — covers RAG fundamentals but not the GCP-specific deployment half of this module. Flagged for further curation.",
  },
  {
    moduleId: "dec9bea6-f0fe-4dc8-9c85-b687651960f3",
    module: "Prompting & Structured Outputs",
    course: "Generative AI (GenAI)",
    newUrl: "https://www.youtube.com/watch?v=xPVhkBg87Sk",
    newTitle: "Prompt Engineering Full Course for Beginners by IBM",
    reason: "Was the 20-course cross-topic placeholder. Real, current, full prompting course matching the module's objective directly.",
  },
  {
    moduleId: "6cb68990-ac07-455b-bb6b-c23a6f8247e5",
    module: "Model & Prompting Layer",
    course: "AI Stack",
    newUrl: "https://www.youtube.com/watch?v=xPVhkBg87Sk",
    newTitle: "Prompt Engineering Full Course for Beginners by IBM",
    reason: "Same placeholder issue — this module covers model selection AND prompting; video covers the prompting half well, model-selection half still needs a dedicated resource (REVIEW_REQUIRED).",
  },
];

// Whole-course placeholder fixes: 4 modules sharing ONE unrelated video, replaced with ONE
// topically-correct course-level video. This is a real improvement (right subject vs. wrong
// subject) but NOT a full fix — ideally each of these 4 modules gets its own distinct video.
// Every one of the 4 modules per course is intentionally left pointing to the SAME new URL
// here (not silently masked as fully fixed) — the report marks all of these REVIEW_REQUIRED
// for follow-up per-module curation.
const COURSE_LEVEL_FIXES = [
  { course: "MLOps (Machine Learning Operations)", newUrl: "https://www.youtube.com/watch?v=UuR8gjcRIeg", newTitle: "MLOps Using GCP Explained | End-to-End ML Pipeline on Google Cloud" },
  { course: "LLMOps", newUrl: "https://www.youtube.com/watch?v=cvPEiPt7HXo", newTitle: "Large Language Model Operations (LLMOps) Explained" },
  { course: "AWS AI", newUrl: "https://www.youtube.com/watch?v=WZeZZ8_W-M4", newTitle: "AWS Certified AI Practitioner (AIF-C01) – Full Course to PASS the Certification Exam" },
];

async function main() {
  const report = [];

  for (const fix of FIXES) {
    const { data: mod } = await supabase.from("modules").select("id, title, video_url").eq("id", fix.moduleId).maybeSingle();
    if (!mod) {
      report.push({ ...fix, status: "SKIPPED — module not found" });
      continue;
    }
    console.log(`${APPLY ? "APPLYING" : "DRY RUN"}: ${fix.course} / ${fix.module}\n  old: ${mod.video_url}\n  new: ${fix.newUrl} (${fix.newTitle})\n  reason: ${fix.reason}\n`);
    if (APPLY) {
      const { error } = await supabase.from("modules").update({ video_url: fix.newUrl }).eq("id", fix.moduleId);
      report.push({ ...fix, oldUrl: mod.video_url, status: error ? `FAILED: ${error.message}` : "APPLIED" });
    } else {
      report.push({ ...fix, oldUrl: mod.video_url, status: "DRY_RUN" });
    }
  }

  for (const cfix of COURSE_LEVEL_FIXES) {
    const { data: course } = await supabase.from("courses").select("id, title").eq("title", cfix.course).maybeSingle();
    if (!course) {
      report.push({ ...cfix, status: "SKIPPED — course not found" });
      continue;
    }
    const { data: mods } = await supabase.from("modules").select("id, title, video_url").eq("course_id", course.id);
    for (const mod of mods ?? []) {
      console.log(`${APPLY ? "APPLYING" : "DRY RUN"}: ${cfix.course} / ${mod.title}\n  old: ${mod.video_url}\n  new: ${cfix.newUrl} (${cfix.newTitle}, course-level — REVIEW_REQUIRED for per-module curation)\n`);
      if (APPLY) {
        const { error } = await supabase.from("modules").update({ video_url: cfix.newUrl }).eq("id", mod.id);
        report.push({ course: cfix.course, module: mod.title, oldUrl: mod.video_url, newUrl: cfix.newUrl, status: error ? `FAILED: ${error.message}` : "APPLIED_COURSE_LEVEL_REVIEW_REQUIRED" });
      } else {
        report.push({ course: cfix.course, module: mod.title, oldUrl: mod.video_url, newUrl: cfix.newUrl, status: "DRY_RUN" });
      }
    }
  }

  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main();
