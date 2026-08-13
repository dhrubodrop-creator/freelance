import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "2c0fbe31-57cd-4825-b773-b7d86dbe6e49"; // Certification Push

const sections = [
  {
    section_type: "the_field",
    title: "What it actually takes to go from studied to exam-ready for AIF-C01",
    order_index: 0,
    content: "This module is the synthesis of Modules 1-3's content into genuine exam readiness — the AIF-C01 exam guide's full domain breakdown, a real mock exam, and a targeted weak-area drill. \"Exam-ready\" specifically means: can reliably score above the passing threshold on a realistic full-length mock under real time pressure, not just \"has watched all the material.\"\n\nAIF-C01 is scored 100-1000, with a passing score of 700. The exam has 85 minutes for 65 questions (50 scored, 15 unscored pretest items you can't identify), which is roughly 78 seconds per question — tight enough that time management is a real, testable skill on its own.",
  },
  {
    section_type: "mental_models",
    title: "How to think about certification-push exam strategy",
    order_index: 1,
    content: "**1. A mock exam score only means something if taken under real conditions** — full length, real time limit, no pausing to look things up; anything else measures recall in a low-pressure setting, not exam readiness.\n\n**2. Weak-area review is only useful when it's traced to a specific gap, not a vague \"I need to study more\"** — every missed mock question should map back to a specific mental model, decision-framework branch, or exam domain from Modules 1-3.\n\n**3. The 700/1000 passing bar means a small number of genuinely mastered domains can offset a weaker one** — but the exam is domain-weighted, so know which domains carry the most questions before deciding where to spend remaining study time.\n\n**4. Answering \"which is the BEST answer\" questions requires eliminating plausible-but-wrong distractors, not just recognizing a correct-sounding option** — AWS exams are notorious for multiple technically-true answers where only one is fully correct.",
  },
  {
    section_type: "decision_framework",
    title: "How to prioritize remaining study time before exam day",
    order_index: 2,
    content: "IF a mock exam domain score is well below your overall average THEN prioritize that domain first — it has the highest return on remaining study time.\n\nIF you're consistently missing questions from misreading the scenario rather than not knowing the content THEN the fix is practicing under time pressure, not re-studying material you already know.\n\nIF two mock exam attempts show the same domain as weak THEN treat it as a genuine gap requiring a full re-read of that domain's module content, not just another quiz attempt.\n\nIF your mock score is comfortably above 700 with no domain below your average by more than ~10% THEN you're likely exam-ready — further drilling has diminishing returns versus just taking the real exam.",
  },
  {
    section_type: "workflow",
    title: "The actual certification-push process",
    order_index: 3,
    content: "1. Re-read the official AIF-C01 exam guide's full domain weighting table, and note which domains carry the most questions.\n\n2. Take a full-length, realistic mock exam (85 minutes, 65 questions, no pausing) as a genuine baseline.\n\n3. Score the mock by domain, not just overall, to find the specific weak area(s).\n\n4. Re-review the weak domain's content from Modules 1-3 (or the exam guide directly for anything not covered here), focused specifically on the gap the mock revealed.\n\n5. Take a second full-length mock under the same real conditions.\n\n6. Compare domain-by-domain scores between the two mocks to confirm the weak area actually improved, not just the overall score.\n\n7. Schedule the real exam once two consecutive mocks land comfortably above 700 with no domain badly lagging.",
  },
  {
    section_type: "failure_modes",
    title: "How certification pushes actually go wrong",
    order_index: 4,
    content: "Failure 1 — Taking mock exams under low-pressure conditions (pausing, looking things up, no timer).\nWhat: mock scores look strong, but the real exam's time pressure exposes gaps the untimed mocks never revealed.\nDetect: compare your mock-taking conditions honestly against the real exam's 85-minute, no-pause format.\nPrevent: always take mocks under full real conditions, per this module's mental models.\nExam-day risk: running out of time on the last 10-15 questions because pacing was never actually practiced.\n\nFailure 2 — Re-studying content you already know instead of the domain the mock actually flagged as weak.\nWhat: study time goes to comfortable, already-mastered material because it feels more productive than confronting a genuine weak area.\nDetect: check whether your study time allocation actually matches your mock's domain-by-domain weak-area breakdown.\nPrevent: use this module's decision framework to prioritize the domain the data says is weakest, not the one that feels most urgent.\nExam-day risk: the same weak domain resurfaces on the real exam, unaddressed.",
  },
  {
    section_type: "checklist",
    title: "AIF-C01 Exam-Ready Checklist",
    order_index: 5,
    content: "- [ ] Read the official AIF-C01 exam guide's domain weighting table and know which domains carry the most questions\n- [ ] Taken at least one full-length, realistic (timed, no-pause) mock exam\n- [ ] Scored the mock by domain, not just overall\n- [ ] Re-reviewed the specific weak domain(s) the mock revealed, not general review\n- [ ] Taken a second full-length mock and confirmed the weak domain genuinely improved\n- [ ] Two consecutive mocks land comfortably above 700 with no domain badly lagging\n- [ ] Comfortable eliminating plausible-but-wrong distractors on \"BEST answer\" style questions",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- AWS's official AIF-C01 exam guide (domain weighting table specifically) — the authoritative source for prioritizing remaining study time.\n- AWS Skill Builder's official AIF-C01 practice exam — the closest available approximation to real exam conditions and question style.\n\nReference\n- This course's Modules 1-3 — the direct content source for re-reviewing any domain a mock exam flags as weak.",
  },
];

const exercises = [
  {
    level: "capstone",
    order_index: 0,
    title: "Capstone: a full AIF-C01 mock exam plus weak-area drill",
    problem_statement: "Take a full-length, realistic AIF-C01 mock exam (85 minutes, 65 questions, no pausing). Score it by domain. Identify the weakest domain, re-review that domain's content specifically, then take a second full mock under the same conditions and confirm the weak domain improved.",
    starter_context: "This matches this module's and this course's stated capstone build deliverable exactly: a full AIF-C01 mock exam plus weak-area drill.",
    hints: [
      "Score both mocks by domain, not just overall — the domain-level comparison is what proves the weak-area drill actually worked.",
    ],
    solution_notes: "A strong capstone submission shows both mock scores broken down by domain, a clear identification of the weakest domain, and evidence the second mock's score for that specific domain improved — not just a higher overall score, which could mask a domain that's still weak.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "How is the AIF-C01 exam scored, and what's the passing bar?", what_is_tested: "Basic exam-mechanics fluency expected of anyone claiming the certification.", strong_answer_structure: "State the 100-1000 scale with a 700 passing score, and that the exam includes unscored pretest items mixed in with scored questions.", weak_answer_example: "\"You just need to get most of them right\" — no actual familiarity with the scoring mechanics.", follow_up_question: "Why might your raw percentage of correct answers not directly map to your scaled score?" },
  { category: "applied", order_index: 1, question: "You've taken two mock exams and both times you're weakest on the same domain. What's your next move?", what_is_tested: "Applied understanding of this module's weak-area-prioritization decision framework.", strong_answer_structure: "Treat a domain that's weak on two separate mocks as a genuine gap requiring a full re-read of that domain's content, not just another quiz attempt.", weak_answer_example: "Just taking a third mock exam without changing the study approach.", follow_up_question: "How would you confirm the re-review actually closed the gap, rather than assuming it did?" },
  { category: "behavioural", order_index: 2, question: "Tell me about how you prepared for the AIF-C01 exam — what was your actual process?", what_is_tested: "Whether the candidate has a genuine, structured prep process versus passive video-watching.", strong_answer_structure: "Describe domain-weighted prioritization, realistic timed mocks, and targeted weak-area review based on mock data — the process this module establishes.", weak_answer_example: "\"I watched the course videos and then took the exam\" — no evidence of deliberate, data-driven prep.", follow_up_question: "What was the weakest domain you found, and how did you confirm you'd fixed it?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "AWS Bedrock & SageMaker").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("AWS AI Module 4 (Certification Push) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
