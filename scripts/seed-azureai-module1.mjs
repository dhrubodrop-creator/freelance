import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "f6826172-235c-47e3-a4d4-ada1d69b8eee"; // AI Fundamentals on Azure (AI-900 track)

const sections = [
  {
    section_type: "the_field",
    title: "What the AI-900 exam actually tests, and why Responsible AI is a first-class domain on Azure specifically",
    order_index: 0,
    content: "AI-900 (Microsoft Azure AI Fundamentals) is Azure's entry-level, no-code-required AI certification — it tests conceptual fluency with AI/ML/GenAI ideas and Azure's AI service landscape, not hands-on model-building. Its distinguishing feature relative to AWS's and GCP's equivalents is how heavily it weights Responsible AI: Microsoft treats fairness, reliability/safety, privacy/security, inclusiveness, transparency, and accountability as testable, named principles, not a general aside.\n\nThis module covers the exam's foundational domains: AI vs. GenAI, foundational models and transformers, and Responsible AI principles specifically as Microsoft frames them. Module 2 moves into the actual Azure services (AI Services, Microsoft Foundry, Azure OpenAI).",
  },
  {
    section_type: "mental_models",
    title: "How to think about AI-900's foundational concepts",
    order_index: 1,
    content: "**1. \"AI\" and \"GenAI\" are tested as a hierarchy, not synonyms** — GenAI (foundation models producing novel content) is a subset of the broader AI/ML field that also includes classification, regression, and traditional predictive models; the exam expects you to place a given scenario correctly within that hierarchy.\n\n**2. The transformer architecture is the specific technical fact the exam expects you to know underlies modern foundation models** — not implementation detail, but enough conceptual fluency to recognize why foundation models can handle long-range context and parallel training in a way earlier architectures couldn't.\n\n**3. Microsoft's six Responsible AI principles (fairness, reliability/safety, privacy/security, inclusiveness, transparency, accountability) are each individually testable and distinct** — the exam will present a scenario testing exactly one principle, and picking a plausible-but-wrong principle is the most common miss in this domain.\n\n**4. Responsible AI on AI-900 is about naming the correct principle for a given scenario, not implementing a mitigation** — that hands-on implementation lens comes later in Module 3's copilot-evaluation content.",
  },
  {
    section_type: "decision_framework",
    title: "How to identify the correct Responsible AI principle for a scenario",
    order_index: 2,
    content: "IF the scenario involves a model performing worse for one demographic group than another THEN it's testing fairness.\n\nIF the scenario involves a model producing consistent, safe results even under unusual or adversarial input THEN it's testing reliability and safety.\n\nIF the scenario involves protecting training data or user data from exposure THEN it's testing privacy and security.\n\nIF the scenario involves a system being usable by people with a wide range of abilities or backgrounds THEN it's testing inclusiveness.\n\nIF the scenario involves being able to explain why a model produced a given output THEN it's testing transparency.\n\nIF the scenario involves who is answerable for a model's real-world impact THEN it's testing accountability — distinct from transparency (explainability) even though the two are often confused on this exam.",
  },
  {
    section_type: "workflow",
    title: "The real study process for this domain",
    order_index: 3,
    content: "1. Read Microsoft's official AI-900 exam skills outline before any video content, to see the exact domain weighting.\n\n2. Write, in your own words, a one-sentence definition of each of the six Responsible AI principles — this is the single highest-value drill for this domain.\n\n3. Drill the principle-identification decision framework above against sample scenarios until classification is instant.\n\n4. Read a short explanation of the transformer architecture (attention mechanism, parallel training) at a conceptual, non-mathematical level — enough for exam fluency, not implementation.\n\n5. Take a first practice quiz focused on this domain specifically before moving to Module 2's service-specific content.",
  },
  {
    section_type: "failure_modes",
    title: "Where AI-900 candidates actually lose points on Fundamentals",
    order_index: 4,
    content: "Failure 1 — Confusing transparency (explainability) with accountability (who answers for the outcome) on Responsible AI questions.\nWhat: a scenario about assigning organizational responsibility for a model's real-world impact gets misclassified as testing transparency, because both principles sound related to \"knowing what happened.\"\nDetect: check whether the scenario is asking \"can we explain the output\" (transparency) or \"who is answerable for the outcome\" (accountability) — they're different questions.\nPrevent: memorize the explicit distinction in this module's decision framework, since this is the most common Responsible AI confusion on this exam.\nExam-style trap: a scenario deliberately worded to sound like it could be either principle.\n\nFailure 2 — Treating all generative AI output as a black box the exam can't ask about mechanistically.\nWhat: missing a question about why transformers handle long-range context well, because the candidate assumed the exam wouldn't test \"how it actually works\" at even a conceptual level.\nDetect: check whether any missed questions touched on the transformer/attention-mechanism concept specifically.\nPrevent: cover the conceptual (non-mathematical) transformer explanation from this module's workflow — AI-900 does test this at a basic level.\nExam-style trap: a scenario framed as a GenAI capability question that's actually testing basic transformer-architecture knowledge.",
  },
  {
    section_type: "checklist",
    title: "AI-900 Fundamentals Domain Checklist",
    order_index: 5,
    content: "- [ ] Can place a given scenario correctly within the AI/ML/GenAI hierarchy, not treat them as synonyms\n- [ ] Can explain, at a conceptual level, why the transformer architecture underlies modern foundation models\n- [ ] Can name and define all six of Microsoft's Responsible AI principles from memory\n- [ ] Can correctly identify which single principle a given scenario is testing, using this module's decision framework\n- [ ] Specifically confident distinguishing transparency from accountability\n- [ ] Has taken at least one practice quiz on this domain and reviewed every miss",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Microsoft's official AI-900 exam skills outline — the definitive, authoritative source for what's testable in this domain.\n- Microsoft Learn's free AI-900 learning path — Microsoft's own structured prep content, directly aligned to the exam skills outline.\n\nReference\n- This course's Module 2 (Azure AI Services & Microsoft Foundry) — direct hands-on complement to the conceptual service knowledge built here.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Classify ten scenarios by Responsible AI principle",
    problem_statement: "Write (or source from Microsoft's own AI-900 sample questions) ten short scenarios, each testing exactly one of the six Responsible AI principles. Classify each correctly using this module's decision framework, paying particular attention to the transparency-vs-accountability distinction.",
    starter_context: "Deliverable per this course's stated outcome: AI-900 practice review.",
    hints: [
      "Deliberately include at least two scenarios that could plausibly be confused for each other (e.g., one transparency, one accountability) to test your own discrimination between them.",
    ],
    solution_notes: "A strong submission classifies all ten correctly and can explain, for the trickiest 2-3, specifically why a plausible-but-wrong principle doesn't fit.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Take and review a Fundamentals-domain practice quiz",
    problem_statement: "Take a practice quiz (Microsoft Learn or a reputable third-party bank) covering AI-900's Fundamentals domain only. For every missed question, identify which mental model or decision-framework branch from this module was violated.",
    starter_context: null,
    hints: [
      "If most misses are Responsible AI principle-confusion, that's a strong signal to redo the classification drill before moving on, not just re-read the definitions.",
    ],
    solution_notes: "A strong review connects every miss to a specific gap in this module's content, not a vague \"I need to study more.\"",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What's the difference between transparency and accountability as Responsible AI principles?", what_is_tested: "The most commonly confused Responsible AI distinction on AI-900.", strong_answer_structure: "Transparency is about being able to explain why a model produced a given output; accountability is about who is answerable for the model's real-world impact — related but genuinely distinct concerns.", weak_answer_example: "\"They both mean being open about the AI\" — fails to distinguish the two.", follow_up_question: "Give a scenario where a system could be transparent but not accountable, or vice versa." },
  { category: "fundamentals", order_index: 1, question: "Is all generative AI also machine learning? Is all machine learning generative AI?", what_is_tested: "Correct placement within the AI/ML/GenAI hierarchy.", strong_answer_structure: "Generative AI is a subset of the broader AI/ML field; all GenAI is ML-based, but most ML (classification, regression, traditional predictive models) isn't generative.", weak_answer_example: "Treating AI, ML, and GenAI as interchangeable terms.", follow_up_question: "Give an example of an ML system that isn't generative AI." },
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

console.log("Azure AI Module 1 (AI Fundamentals on Azure AI-900 track) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
