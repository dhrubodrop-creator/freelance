import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "b3dde503-96da-49fa-833f-6cc1f819dddd"; // Vertex AI Platform Overview

const sections = [
  {
    section_type: "the_field",
    title: "What choosing correctly between AutoML, custom training, and Model Garden actually requires",
    order_index: 0,
    content: "Vertex AI is Google Cloud's unified ML platform — it consolidates what used to be several separate products (AutoML, AI Platform, and others) into one console and API surface. The three paths this module covers — AutoML, custom training, and Model Garden — represent three genuinely different tradeoffs between effort and control, and the build deliverable (training a model both ways on the same dataset) exists specifically so you feel that tradeoff directly, not just read about it.\n\nAutoML trades control for speed: point it at labeled data, and Vertex AI handles feature engineering, architecture search, and hyperparameter tuning automatically. Custom training trades speed for control: you write and run your own training code (TensorFlow, PyTorch, scikit-learn) on managed infrastructure. Model Garden is Vertex AI's catalog of pretrained and foundation models (including Gemini) — the managed-model-first option, similar in spirit to AWS Bedrock.",
  },
  {
    section_type: "mental_models",
    title: "How to think about Vertex AI's three paths",
    order_index: 1,
    content: "**1. AutoML is justified when the marginal gain from custom architecture/feature work is genuinely small relative to the effort** — it's most competitive on structured/tabular data and common vision/NLP tasks, less so where domain-specific architecture choices matter a lot.\n\n**2. Custom training's real cost isn't the training run — it's building and maintaining the training code and its dependencies** — the decision to go custom should weigh the ongoing maintenance burden, not just the one-time setup effort.\n\n**3. Model Garden is Vertex AI's \"don't train anything\" option, parallel to AutoML's \"train automatically\" and custom training's \"train it yourself\"** — three genuinely distinct points on the effort/control spectrum, not just marketing variations of the same thing.\n\n**4. The same dataset can validly go through more than one of these paths in a real project** — using AutoML as a fast baseline before deciding whether custom training's added effort is actually justified is a legitimate, common workflow, not redundant work.",
  },
  {
    section_type: "decision_framework",
    title: "Which Vertex AI path fits a given problem?",
    order_index: 2,
    content: "IF the task can use a pretrained/foundation model as-is or with light tuning THEN start with Model Garden — it's the lowest-effort path when it fits.\n\nIF the task needs a custom model on structured/tabular data or a common vision/NLP task, and no existing foundation model fits well THEN try AutoML first — establish a real baseline before investing in custom training.\n\nIF AutoML's baseline genuinely underperforms, or the task needs domain-specific architecture/feature engineering AutoML can't express THEN move to custom training — and budget for its real ongoing code-maintenance cost.\n\nIF you're unsure which path fits THEN default to trying the lowest-effort option first (Model Garden, then AutoML) and only escalate when it demonstrably falls short — never start with custom training by default.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this module's build deliverable",
    order_index: 3,
    content: "1. Pick a real (even if small) labeled dataset appropriate for a structured-data or common vision/NLP task.\n\n2. Upload it to Vertex AI and train an AutoML model on it, using Vertex AI's automatic evaluation metrics as your baseline.\n\n3. Write custom training code (a simple scikit-learn or TensorFlow model is enough) for the same task, and run it as a Vertex AI custom training job on the same dataset.\n\n4. Compare the two models' evaluation metrics directly — accuracy/precision/recall or the task-appropriate equivalent.\n\n5. Write one paragraph on which path you'd actually choose for this specific dataset and task, and why — grounded in the real metric comparison, not just the theoretical tradeoff.",
  },
  {
    section_type: "failure_modes",
    title: "Where the AutoML-vs-custom-training decision actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Defaulting to custom training out of habit or perceived prestige, without ever establishing an AutoML baseline.\nWhat: significant custom-training effort is spent, and the resulting model doesn't meaningfully outperform what AutoML would have produced with a fraction of the effort.\nDetect: check whether an AutoML baseline was ever actually run and compared against, or skipped entirely.\nPrevent: apply this module's decision framework — try the lower-effort path first, and only escalate with evidence it's warranted.\nInterview question: \"When would you skip AutoML and go straight to custom training?\"\n\nFailure 2 — Choosing AutoML for a task with strong domain-specific structure AutoML can't exploit.\nWhat: AutoML underperforms noticeably on a task where domain expertise (specific feature engineering, a known-effective architecture) would meaningfully help, and this gets misread as \"the data just isn't good enough\" rather than \"this task needed custom training.\"\nDetect: check whether the task has genuine domain-specific structure that a general-purpose AutoML search is unlikely to discover on its own.\nPrevent: recognize tasks with strong domain-specific priors as a signal to move to custom training earlier, per this module's decision framework.\nInterview question: \"What kind of task would make you skip AutoML entirely?\"",
  },
  {
    section_type: "checklist",
    title: "Vertex AI Path-Selection Checklist",
    order_index: 5,
    content: "- [ ] Checked whether an existing Model Garden foundation model already fits the task before considering training anything\n- [ ] Ran an AutoML baseline before committing to custom training effort\n- [ ] Trained the same dataset both ways (AutoML and custom) and compared real evaluation metrics\n- [ ] Can articulate, with a specific metric comparison, which path fits this dataset and why\n- [ ] Considered the ongoing maintenance cost of custom training code, not just the one-time training effort",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Google Cloud's official Vertex AI documentation, \"Choose a training method\" — the direct, authoritative reference for this module's decision framework.\n- Vertex AI's Model Garden documentation — direct reference for the pretrained/foundation-model path.\n\nReference\n- This course's Module 2 (Building with Gemini) — direct follow-on for going deeper into the Model Garden / foundation-model path specifically.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Train the same dataset both ways",
    problem_statement: "Pick a real labeled dataset. Train it via AutoML on Vertex AI, then write custom training code for the same task and run it as a Vertex AI custom training job. Compare real evaluation metrics between the two.",
    starter_context: "This matches this module's stated build deliverable exactly.",
    hints: [
      "Run the AutoML baseline first — it's the fast, low-effort reference point the custom-training comparison needs.",
    ],
    solution_notes: "A strong submission has real evaluation metrics from both paths and a specific, metric-grounded recommendation for which path fits — not just a general statement that \"it depends.\"",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Justify a path choice for three new scenarios",
    problem_statement: "Given three short problem descriptions (write your own, spanning a structured-data task, a task with strong domain-specific structure, and a task a foundation model could likely already handle), decide which Vertex AI path fits each and justify it using this module's decision framework.",
    starter_context: null,
    hints: [
      "For the task a foundation model could plausibly already handle, resist the urge to reach for AutoML or custom training by default.",
    ],
    solution_notes: "A strong submission picks a different path for each of the three scenarios (not the same path three times) and justifies each choice against the specific structure of that task.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What's the real tradeoff between AutoML and custom training on Vertex AI?", what_is_tested: "Core understanding of the effort/control spectrum this module establishes.", strong_answer_structure: "Explain that AutoML trades control for speed via automatic feature/architecture/hyperparameter search, while custom training trades speed for full control, with an ongoing code-maintenance cost.", weak_answer_example: "\"AutoML is worse than custom training\" — misses that AutoML is often the right choice, not just a lesser option.", follow_up_question: "When would AutoML's baseline be good enough that further custom training isn't worth it?" },
  { category: "applied", order_index: 1, question: "A client has a tabular churn-prediction dataset and no ML team. What path would you recommend on Vertex AI, and why?", what_is_tested: "Applied path-selection judgment for a realistic scenario.", strong_answer_structure: "Recommend starting with AutoML given the structured-data task and lack of an ML team to maintain custom training code, establishing a baseline before considering anything more custom.", weak_answer_example: "Recommending custom training by default without weighing the client's actual capacity to maintain it.", follow_up_question: "What would make you reconsider and suggest custom training instead?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "Google Vertex AI").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("GCP AI Module 1 (Vertex AI Platform Overview) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
