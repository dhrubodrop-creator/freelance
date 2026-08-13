import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "7e446c51-544b-4814-81e1-b72e55e7be6a"; // AI-103 Certification Push

const sections = [
  {
    section_type: "the_field",
    title: "What it actually takes to be exam-ready for AI-103, and why the credential changed",
    order_index: 0,
    content: "This module is the synthesis of Modules 1-3's content into genuine exam readiness for the Azure AI Apps and Agents Developer Associate certification (exam AI-103) — the current credential, which replaced AI-102 (Azure AI Engineer Associate) after AI-102 was retired on June 30, 2026. If you're studying from material referencing AI-102, the underlying skills largely transfer, but the exam code, some domain weighting, and any content specifically covering agent-building patterns are AI-103-specific and worth double-checking against Microsoft's current exam guide.\n\n\"Exam-ready\" means the same thing here as on the AWS AI course's certification-push module: reliably scoring above the passing threshold on a full-length, realistic mock exam under real time pressure — not just having watched all the material.",
  },
  {
    section_type: "mental_models",
    title: "How to think about the AI-103 certification push specifically",
    order_index: 1,
    content: "**1. A credential name/number change (AI-102 to AI-103) usually signals real content change, not just rebranding** — AI-103's added emphasis on AI apps and agents reflects Microsoft's own platform shift toward agentic patterns (Foundry, copilots), so don't assume older AI-102 prep material fully covers the current scope.\n\n**2. A mock exam score only means something if taken under real conditions** — full length, real time limit, no pausing to look things up, the same discipline established in the AWS AI course's certification-push module.\n\n**3. Weak-area review is only useful when it's traced to a specific gap** — every missed mock question should map back to a specific mental model, decision-framework branch, or module (1, 2, or 3) from this course.\n\n**4. Hands-on labs matter more for AI-103 specifically than for a purely conceptual exam like AI-900** — because AI-103 tests applied building (Foundry, Prompt Flow, agent patterns), gaps here are more often \"I haven't actually built this\" than \"I don't know the definition.\"",
  },
  {
    section_type: "decision_framework",
    title: "How to prioritize remaining study time before exam day",
    order_index: 2,
    content: "IF a mock exam domain score is well below your overall average THEN prioritize that domain first — it has the highest return on remaining study time.\n\nIF a missed question is about a hands-on building pattern (deploying a model, building a Prompt Flow, configuring an agent) rather than a pure concept THEN the fix is redoing the relevant hands-on lab from Modules 2-3, not just re-reading notes.\n\nIF your prep material predates the AI-102-to-AI-103 transition THEN cross-check its domain coverage against Microsoft's current AI-103 exam guide before trusting it as complete.\n\nIF two mock attempts show the same domain as weak THEN treat it as a genuine gap requiring full re-review of that module's content, not just another quiz attempt.",
  },
  {
    section_type: "workflow",
    title: "The actual certification-push process for AI-103",
    order_index: 3,
    content: "1. Read the official AI-103 exam guide's current domain weighting table directly from Microsoft — don't rely on secondhand summaries, especially given the recent AI-102-to-AI-103 transition.\n\n2. Take a full-length, realistic mock exam under real conditions (timed, no pausing) as a genuine baseline.\n\n3. Score the mock by domain, and specifically flag any missed question tied to a hands-on building pattern versus a pure concept.\n\n4. For concept gaps, re-review the relevant module's content; for hands-on gaps, actually redo the relevant lab (deploy via Foundry, build a Prompt Flow, etc.) rather than just re-reading about it.\n\n5. Take a second full-length mock under the same conditions and confirm the weak domain improved.\n\n6. Schedule the real exam once two consecutive mocks land comfortably above the passing threshold with no domain badly lagging.",
  },
  {
    section_type: "failure_modes",
    title: "How AI-103 certification pushes actually go wrong",
    order_index: 4,
    content: "Failure 1 — Studying from AI-102 material without checking it against AI-103's current scope.\nWhat: significant study time goes into content that's no longer fully representative of the current exam, particularly around agent-building patterns AI-103 added emphasis on, leaving real gaps on exam day.\nDetect: cross-check any older material's table of contents against the current AI-103 exam guide's domain list.\nPrevent: always confirm study material against Microsoft's current, live exam guide before trusting it as complete, per this module's decision framework.\nExam-day risk: encountering agent-pattern questions with no real prep behind them.\n\nFailure 2 — Treating a hands-on building gap as if it were a conceptual gap, and just re-reading instead of rebuilding.\nWhat: a missed question about actually configuring something in Foundry or Prompt Flow gets \"fixed\" by re-reading notes about it, without ever actually redoing the hands-on lab, so the gap persists into the real exam.\nDetect: check whether a missed question is testing \"do you know what this is\" (concept) or \"have you actually done this\" (hands-on) before choosing how to review it.\nPrevent: redo the actual lab for any hands-on-flavored miss, per this module's decision framework — re-reading isn't sufficient for that kind of gap.\nExam-day risk: hands-on-flavored scenario questions remain genuinely unfamiliar despite \"studying\" the topic.",
  },
  {
    section_type: "checklist",
    title: "AI-103 Exam-Ready Checklist",
    order_index: 5,
    content: "- [ ] Confirmed study material is current against Microsoft's live AI-103 exam guide, not stale AI-102 content\n- [ ] Taken at least one full-length, realistic (timed, no-pause) mock exam\n- [ ] Scored the mock by domain, distinguishing concept misses from hands-on-building misses\n- [ ] Redone the actual relevant lab for any hands-on-flavored miss, not just re-read notes\n- [ ] Taken a second full mock and confirmed the weak domain genuinely improved\n- [ ] Two consecutive mocks land comfortably above the passing threshold with no domain badly lagging",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Microsoft's official AI-103 exam guide (current, live version) — the authoritative source given the recent AI-102-to-AI-103 transition; always check the live version, not an archived copy.\n- Microsoft Learn's official AI-103 learning path, including its hands-on lab exercises — direct reference for closing hands-on-building gaps specifically.\n\nReference\n- This course's Modules 1-3 — the direct content source for re-reviewing any domain a mock exam flags as weak.",
  },
];

const exercises = [
  {
    level: "capstone",
    order_index: 0,
    title: "Capstone: a full AI-103 mock exam plus gap review",
    problem_statement: "Take a full-length, realistic AI-103 mock exam under real time conditions. Score it by domain, distinguishing concept gaps from hands-on-building gaps. For hands-on gaps specifically, redo the actual relevant lab rather than just re-reading. Take a second mock and confirm improvement.",
    starter_context: "This matches this module's and this course's stated capstone build deliverable exactly: a full AI-103 mock exam plus gap review.",
    hints: [
      "Before trusting any third-party mock exam bank, spot-check a few of its questions against the current AI-103 exam guide — some banks lag behind the AI-102-to-AI-103 transition.",
    ],
    solution_notes: "A strong capstone submission shows both mock scores broken down by domain and by concept-vs-hands-on gap type, with clear evidence that hands-on gaps were closed by actually redoing labs, not just re-reading — and confirmation the weakest domain's score genuinely improved on the second mock.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What replaced AI-102, and why does that matter for how you'd prep today?", what_is_tested: "Current awareness of the credential's actual status, not stale knowledge.", strong_answer_structure: "AI-102 (Azure AI Engineer Associate) was retired June 30, 2026, replaced by AI-103 (Azure AI Apps and Agents Developer Associate); prep material should be checked against AI-103's current exam guide, since it added emphasis on agent-building patterns.", weak_answer_example: "Confidently citing AI-102 as the current credential — a real, checkable factual gap.", follow_up_question: "What's one thing AI-103 specifically emphasizes that AI-102 didn't?" },
  { category: "behavioural", order_index: 1, question: "Tell me about a gap your mock exam revealed and how you actually closed it.", what_is_tested: "Whether the candidate distinguishes concept gaps from hands-on gaps and addresses each appropriately.", strong_answer_structure: "Describe a specific missed question, identify whether it was a concept or hands-on-building gap, and describe the corresponding fix (re-review vs. redoing an actual lab) — then how the second mock confirmed the fix worked.", weak_answer_example: "\"I just studied more\" with no specifics on what kind of gap or how it was verified closed.", follow_up_question: "How did you confirm the gap was actually closed, rather than assuming it was?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "Azure AI Services").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Azure AI Module 4 (AI-103 Certification Push) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
