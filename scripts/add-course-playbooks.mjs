// Generates a real, Ropes-authored playbook per course from the curriculum
// already in the database (topics/build/outcome per module), uploads it to
// Supabase Storage, links it via the `playbooks` table so students get an
// actual downloadable artifact, and grounds the AI mentor by loading the
// same material into `content_chunks` for RAG retrieval.
// Run with: node scripts/add-course-playbooks.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

function buildPlaybookMarkdown(course, modules) {
  const lines = [];
  lines.push(`# ${course.title} — Ropes Course Playbook`);
  lines.push("");
  lines.push(course.description ?? "");
  lines.push("");
  lines.push(`**Track:** ${course.track ?? "General"}  `);
  lines.push(`**Modules:** ${modules.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "This playbook is the working reference for the track — use it alongside the module " +
    "videos, not instead of them. Each week has a concrete build and a stated outcome so you " +
    "always know what \"done\" looks like before moving on."
  );
  lines.push("");

  modules.forEach((m, i) => {
    lines.push(`## Week ${i + 1}: ${m.title}`);
    lines.push("");
    if (m.topics?.length) {
      lines.push("**What you'll cover:**");
      for (const t of m.topics) lines.push(`- ${t}`);
      lines.push("");
    }
    if (m.build_deliverable) {
      lines.push(`**Build this week:** ${m.build_deliverable}`);
      lines.push("");
    }
    if (m.outcome) {
      lines.push(`**You'll walk away able to:** ${m.outcome}`);
      lines.push("");
    }
    lines.push(
      `**Reference video:** ${m.video_source_label ?? "curated external resource"} — watch this ` +
      `alongside the checklist above; the video teaches the how, this playbook keeps you honest ` +
      `about what to actually finish before moving to the next week.`
    );
    lines.push("");
    lines.push("**Self-check before moving on:**");
    lines.push(`- [ ] I can explain each topic above in my own words, not just recognize it.`);
    lines.push(`- [ ] I finished the build/deliverable for this week, not just watched the video.`);
    lines.push(`- [ ] If stuck, I asked the AI mentor or booked a 1:1 session instead of skipping ahead.`);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  lines.push("## After you finish");
  lines.push("");
  lines.push(
    "- Bring your capstone build to a 1:1 session for a real review, not just self-assessment.\n" +
    "- Post your build in the community — the fastest way to get client-ready feedback.\n" +
    "- If a concept still doesn't click, ask the AI mentor with the specific week number — it has " +
    "this playbook loaded and can answer in context."
  );
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const { data: courses } = await supabase.from("courses").select("*").order("title");

  for (const course of courses ?? []) {
    const { data: modules } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", course.id)
      .order("order_index");

    if (!modules || modules.length === 0) {
      console.log(`SKIP ${course.slug} — no modules`);
      continue;
    }

    const markdown = buildPlaybookMarkdown(course, modules);
    const path = `${course.id}/playbook.md`;

    const { error: uploadErr } = await supabase.storage
      .from("course-content")
      .upload(path, new Blob([markdown], { type: "text/markdown" }), {
        contentType: "text/markdown",
        upsert: true,
      });

    if (uploadErr) {
      console.error(`FAILED upload for ${course.slug}:`, uploadErr.message);
      continue;
    }

    await supabase.from("playbooks").delete().eq("course_id", course.id);
    const { error: playbookErr } = await supabase.from("playbooks").insert({
      course_id: course.id,
      file_url: path,
      title: `${course.title} — Course Playbook`,
    });
    if (playbookErr) {
      console.error(`FAILED playbook row for ${course.slug}:`, playbookErr.message);
      continue;
    }

    // Ground the AI mentor: one content_chunks row per module with real material.
    await supabase.from("content_chunks").delete().eq("course_id", course.id).eq("source_type", "playbook");
    const chunkRows = modules.map((m) => ({
      course_id: course.id,
      module_id: m.id,
      source_type: "playbook",
      content: [
        `Module: ${m.title}.`,
        m.topics?.length ? `Topics: ${m.topics.join("; ")}.` : "",
        m.build_deliverable ? `Build/deliverable: ${m.build_deliverable}` : "",
        m.outcome ? `Outcome: ${m.outcome}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    }));
    const { error: chunkErr } = await supabase.from("content_chunks").insert(chunkRows);
    if (chunkErr) {
      console.error(`FAILED content_chunks for ${course.slug}:`, chunkErr.message);
      continue;
    }

    console.log(`OK   ${course.slug}  playbook uploaded, ${chunkRows.length} mentor chunks loaded`);
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});
