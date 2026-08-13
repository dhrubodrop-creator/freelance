import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "e1865229-3428-419f-b297-1c9915d6dc4a"; // Production Pipelines

const sections = [
  {
    section_type: "the_field",
    title: "What a reproducible, production-style Vertex AI Pipeline actually requires",
    order_index: 0,
    content: "Vertex AI Pipelines is Google Cloud's managed Kubeflow Pipelines / TFX runner — it orchestrates an ML workflow (data prep, training, evaluation, deployment) as a directed acyclic graph of containerized components, with each run tracked, versioned, and reproducible. This is the MLOps layer of Vertex AI, distinct from Module 1's single-model training and Module 2's single-feature Gemini work.\n\nThe build deliverable — an end-to-end Vertex AI Pipeline for a real prediction task — mirrors the pipeline-orchestration discipline taught in this catalog's dedicated MLOps course track, applied specifically to Vertex AI's component and orchestration model rather than a general/cloud-agnostic one.",
  },
  {
    section_type: "mental_models",
    title: "How to think about Vertex AI Pipelines specifically",
    order_index: 1,
    content: "**1. A pipeline component is a self-contained, containerized unit with defined inputs/outputs** — this is what makes a Vertex AI Pipeline actually reproducible: rerunning it with the same inputs is guaranteed to produce the same component executions, unlike an ad-hoc notebook.\n\n**2. Pipeline caching means a rerun skips components whose inputs haven't changed** — this is a real practical benefit (fast iteration) but also a real failure-mode risk (silently reusing stale results) if you don't understand when it triggers.\n\n**3. Monitoring and cleanup are part of the pipeline's actual production lifecycle, not afterthoughts** — a pipeline that runs successfully once but leaves orphaned resources (endpoints, artifacts) running is not actually production-style.\n\n**4. Component orchestration (the DAG structure) is where most of a pipeline's real design decisions live** — which steps can run in parallel, which are strictly sequential, and where to add conditional branching for evaluation gates.",
  },
  {
    section_type: "decision_framework",
    title: "How to design a Vertex AI Pipeline's structure",
    order_index: 2,
    content: "IF two pipeline steps have no data dependency on each other THEN structure them to run in parallel in the DAG, not sequentially by default.\n\nIF a step's inputs haven't changed since the last run THEN let Vertex AI Pipelines' caching skip it — but explicitly disable caching for any step where staleness would be a real problem (e.g., re-fetching live data).\n\nIF the pipeline includes a model evaluation step THEN add a conditional branch that only proceeds to deployment if the evaluation clears a defined quality bar — never deploy unconditionally.\n\nIF the pipeline creates any standing resource (an endpoint, a large intermediate artifact) THEN the pipeline definition should include or be paired with explicit cleanup, not leave that to manual follow-up.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this module's build deliverable",
    order_index: 3,
    content: "1. Define the pipeline's DAG structure on paper first: which steps (data prep, training, evaluation, deployment) exist, and which have real data dependencies on each other.\n\n2. Write each step as a Vertex AI Pipelines component (using the Kubeflow Pipelines SDK's `@component` decorator or a prebuilt Google Cloud component where one fits).\n\n3. Add a conditional evaluation gate so deployment only happens if the trained model clears a defined quality threshold.\n\n4. Compile and submit the pipeline to Vertex AI Pipelines, and confirm a full successful run end to end.\n\n5. Rerun the pipeline with only the training step's inputs changed, and confirm caching correctly skips the unaffected upstream data-prep step.\n\n6. Check the Vertex AI console for any resources (endpoints, artifacts) the pipeline created, and confirm your cleanup step actually removed what shouldn't persist.",
  },
  {
    section_type: "failure_modes",
    title: "Where Vertex AI Pipelines actually go wrong in practice",
    order_index: 4,
    content: "Failure 1 — Deploying unconditionally regardless of the evaluation step's result.\nWhat: the pipeline always proceeds to deployment, even when the newly trained model performs worse than the currently deployed one, silently degrading production quality.\nDetect: check whether the pipeline's DAG has an actual conditional branch gating deployment on evaluation results, or whether deployment always runs.\nPrevent: add an explicit evaluation gate per this module's decision framework — this is a required, not optional, part of a production-style pipeline.\nInterview question: \"How would you prevent a retraining pipeline from deploying a model that's actually worse than the current one?\"\n\nFailure 2 — Misunderstanding pipeline caching and silently reusing stale results.\nWhat: a step that should re-fetch live data instead gets cached and skipped on a rerun, because its declared inputs technically didn't change, even though the underlying live data did.\nDetect: check whether any step depends on external state that isn't captured in its declared inputs, and would therefore be invisible to the caching mechanism.\nPrevent: explicitly disable caching for steps depending on external, non-input-captured state, per this module's decision framework.\nInterview question: \"When would you explicitly disable a pipeline step's caching, and why?\"",
  },
  {
    section_type: "checklist",
    title: "Vertex AI Pipeline Production-Style Checklist",
    order_index: 5,
    content: "- [ ] Pipeline DAG structured with genuine parallelism where steps have no real data dependency\n- [ ] A conditional evaluation gate exists, and deployment doesn't happen unconditionally\n- [ ] Caching behavior understood and explicitly disabled anywhere staleness would be a real problem\n- [ ] A full pipeline run completes successfully end to end\n- [ ] Rerun with a changed input confirms caching skips only the genuinely unaffected steps\n- [ ] Any resources the pipeline creates (endpoints, artifacts) are cleaned up, not left running indefinitely",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Google Cloud's official Vertex AI Pipelines documentation, \"Build a pipeline\" — the direct, authoritative reference for this module's build deliverable.\n- The Kubeflow Pipelines SDK documentation's `@component` and `@pipeline` decorators — direct reference for writing the pipeline's components.\n\nReference\n- This catalog's MLOps course track (Module 1: Pipeline Architecture & Reproducibility) — direct reference for the general pipeline-design discipline applied here to Vertex AI specifically.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Build an end-to-end Vertex AI Pipeline for a real prediction task",
    problem_statement: "Define a pipeline DAG (data prep, training, evaluation, conditional deployment) for a real prediction task, implement it as Vertex AI Pipelines components, and confirm a full successful run. Add a conditional evaluation gate so deployment only happens if the model clears a defined quality bar.",
    starter_context: "This matches this module's stated build deliverable exactly.",
    hints: [
      "Sketch the DAG on paper before writing any component code — get the dependency structure right first.",
    ],
    solution_notes: "A strong submission has a real, successfully-run pipeline with a genuine conditional evaluation gate, not an unconditional deploy step at the end.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Test and verify pipeline caching behavior",
    problem_statement: "Rerun your pipeline with only one step's inputs changed, and confirm which steps Vertex AI Pipelines' caching correctly skips versus reruns. Identify any step in your pipeline where caching could silently produce a stale result, and explicitly disable caching there.",
    starter_context: null,
    hints: [
      "Check the pipeline run's console UI directly — it shows which steps were cached versus actually executed.",
    ],
    solution_notes: "A strong submission shows evidence of the actual caching behavior observed (which steps skipped, which ran) and correctly identifies any step where caching should be disabled due to external-state dependency.",
  },
];

const interviewQuestions = [
  { category: "applied", order_index: 0, question: "How would you prevent a Vertex AI retraining pipeline from deploying a model that's worse than the one currently in production?", what_is_tested: "Understanding of the conditional-evaluation-gate pattern this module establishes.", strong_answer_structure: "Describe adding a conditional branch in the pipeline DAG that compares the new model's evaluation metrics against a defined quality bar (or the current production model) before allowing deployment to proceed.", weak_answer_example: "\"You'd just monitor it after deployment and roll back if needed\" — misses the preventive, pre-deployment gate this module emphasizes.", follow_up_question: "What metric would you use for that comparison, and why?" },
  { category: "debugging", order_index: 1, question: "You rerun a pipeline expecting fresh data, but the results look identical to the last run. What's your first suspicion?", what_is_tested: "Practical debugging instinct around Vertex AI Pipelines' caching mechanism.", strong_answer_structure: "Suspect pipeline caching skipped a step because its declared inputs technically didn't change, even though the underlying external data did — check whether that step's caching should be explicitly disabled.", weak_answer_example: "Assuming the pipeline itself is broken and rewriting it from scratch.", follow_up_question: "How would you confirm caching was actually the cause, rather than something else?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "MLOps Pipeline Design").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("GCP AI Module 3 (Production Pipelines) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
