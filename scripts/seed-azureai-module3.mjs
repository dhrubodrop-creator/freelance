import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "afd08615-c6b8-4b78-9536-d6eee8b2fe9c"; // Building & Evaluating Copilots

const sections = [
  {
    section_type: "the_field",
    title: "What building and genuinely evaluating a real Azure copilot involves",
    order_index: 0,
    content: "Prompt Flow is Microsoft's tool for orchestrating and testing LLM-powered application logic — chaining prompts, retrieval, and custom code into an executable, versioned flow, with built-in evaluation support. GenAIOps is Microsoft's name for the operational discipline of running GenAI applications reliably in production: versioning, monitoring, and evaluation as ongoing practices, not one-time steps.\n\nThis module's build deliverable — a working copilot with Prompt Flow evaluation attached — makes evaluation a first-class, required part of the build, not something bolted on afterward. This mirrors the LLM Evaluation & Testing discipline taught elsewhere in this catalog, applied specifically to Prompt Flow's evaluation-flow mechanism.",
  },
  {
    section_type: "mental_models",
    title: "How to think about copilots and evaluation on Azure",
    order_index: 1,
    content: "**1. A Prompt Flow \"flow\" is the actual, versioned unit of your copilot's logic** — treating it as disposable prototyping rather than a real artifact under version control is how copilots drift silently between \"tested\" and \"deployed\" versions.\n\n**2. Evaluation flows in Prompt Flow are themselves flows** — they take your copilot's outputs (plus, often, ground-truth references) as input and produce metrics, meaning evaluation is built the same way as the copilot itself, not a fundamentally different kind of artifact.\n\n**3. \"Copilot\" implies a human stays meaningfully in the loop** — a Prompt Flow-built assistant that fully automates a decision without a human review point isn't really a copilot in Microsoft's own framing, and this distinction matters for both the exam and how you scope a real client deliverable.\n\n**4. GenAIOps treats evaluation as continuous, not a one-time pre-launch gate** — a copilot's evaluation metrics should be re-checked whenever the underlying model, prompt, or retrieved data changes, the same regression discipline as traditional software testing.",
  },
  {
    section_type: "decision_framework",
    title: "How to design this module's copilot and its evaluation",
    order_index: 2,
    content: "IF the copilot's task has verifiable correct answers (e.g., retrieval-based Q&A) THEN use metric-based evaluation (groundedness, relevance) with an evaluation flow scored against reference answers.\n\nIF the copilot's task is more open-ended (tone, helpfulness, style) THEN use an LLM-as-judge evaluation flow, with explicit awareness of that method's own limitations (the same judge-reliability discipline taught in this catalog's LLM Evaluation & Testing content).\n\nIF the copilot changes (new prompt, new model version, new retrieved data source) THEN rerun the evaluation flow before considering the change safe to ship — never assume a prompt tweak is safe without re-evaluation.\n\nIF the task fully automates a decision with no human review point THEN reconsider whether \"copilot\" is even the right framing, or whether it needs an explicit human-in-the-loop step to actually be one.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this module's build deliverable",
    order_index: 3,
    content: "1. Design the copilot's core flow in Prompt Flow: prompt(s), any retrieval step, and the final response logic.\n\n2. Build and run the flow against a handful of real test inputs, confirming it behaves as expected.\n\n3. Design a companion evaluation flow, choosing metric-based or LLM-as-judge evaluation per this module's decision framework.\n\n4. Run the evaluation flow against the copilot's outputs and record baseline metrics.\n\n5. Deliberately change one thing (the prompt, the model version) and rerun both flows — confirm the evaluation flow actually detects the resulting change in quality, proving the evaluation is meaningful and not just decorative.\n\n6. Write one paragraph on what your evaluation flow would and wouldn't catch, being honest about its limitations.",
  },
  {
    section_type: "failure_modes",
    title: "Where copilot evaluation on Azure actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Building an evaluation flow that never actually gets rerun after changes.\nWhat: an evaluation flow is built once at launch, but subsequent prompt or model changes ship without rerunning it, so quality regressions go undetected until a user reports them.\nDetect: check whether the evaluation flow has been rerun since the last meaningful change to the copilot, or only run once at initial build.\nPrevent: treat evaluation as continuous per this module's GenAIOps mental model — rerun on every meaningful change, not just at launch.\nInterview question: \"How do you know your copilot's evaluation metrics are still accurate after a prompt change?\"\n\nFailure 2 — Using LLM-as-judge evaluation for a task that actually has verifiable correct answers.\nWhat: a retrieval-based Q&A copilot's answers are evaluated purely by an LLM judge's subjective assessment, when the task's verifiable ground truth would have supported more reliable metric-based scoring.\nDetect: check whether the task genuinely lacks a verifiable correct answer, or whether metric-based evaluation was simply skipped in favor of the easier-to-set-up LLM-as-judge approach.\nPrevent: apply this module's decision framework — use metric-based evaluation whenever verifiable ground truth exists.\nInterview question: \"When would you choose LLM-as-judge evaluation over metric-based evaluation, and when would that be the wrong choice?\"",
  },
  {
    section_type: "checklist",
    title: "Copilot Build & Evaluation Checklist",
    order_index: 5,
    content: "- [ ] Copilot's core logic built as a real, versioned Prompt Flow, not throwaway prototyping\n- [ ] Evaluation method (metric-based vs. LLM-as-judge) deliberately chosen based on whether verifiable ground truth exists\n- [ ] Evaluation flow run against real copilot outputs and baseline metrics recorded\n- [ ] Evaluation flow demonstrably detects a deliberate quality change (proving it's meaningful, not decorative)\n- [ ] A human-in-the-loop point exists if the task's framing genuinely calls for one\n- [ ] Honest documentation of what the evaluation flow would and wouldn't catch",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Microsoft Learn's official Prompt Flow documentation, \"Evaluate your flow\" — the direct, authoritative reference for this module's build deliverable.\n- Microsoft Learn's GenAIOps overview — direct reference for the continuous-evaluation discipline this module's mental models establish.\n\nReference\n- This catalog's LLM Evaluation & Testing skill content (in the AI LLM Testing course track) — direct reference for the general evaluation discipline applied here to Prompt Flow specifically.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Build a working copilot with Prompt Flow evaluation attached",
    problem_statement: "Design and build a copilot's core logic as a Prompt Flow. Attach an evaluation flow (metric-based or LLM-as-judge, chosen deliberately) and run it against the copilot's real outputs to establish baseline metrics.",
    starter_context: "This matches this module's stated build deliverable exactly.",
    hints: [
      "Decide metric-based vs. LLM-as-judge before building the evaluation flow — check whether your task actually has verifiable ground truth first.",
    ],
    solution_notes: "A strong submission has a real, working copilot flow plus a real evaluation flow with recorded baseline metrics — not just a working copilot with evaluation described but not actually run.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Prove your evaluation flow actually detects quality changes",
    problem_statement: "Deliberately degrade your copilot in one specific way (a worse prompt, a weaker model version) and rerun your evaluation flow. Confirm the metrics actually reflect the degradation. If they don't, diagnose why your evaluation flow isn't sensitive to that kind of change.",
    starter_context: null,
    hints: [
      "If the evaluation flow's metrics don't move at all after a deliberate degradation, the evaluation itself likely isn't measuring the right thing — treat that as a real finding, not a failed exercise.",
    ],
    solution_notes: "A strong submission shows a before/after metric comparison that genuinely reflects the deliberate change, plus honest analysis if the evaluation flow turned out to be less sensitive than expected.",
  },
];

const interviewQuestions = [
  { category: "applied", order_index: 0, question: "How would you decide between metric-based evaluation and LLM-as-judge evaluation for a new copilot?", what_is_tested: "Applied understanding of this module's evaluation-method decision framework.", strong_answer_structure: "Check whether the task has verifiable ground truth (favoring metric-based) versus being more open-ended in tone/style/helpfulness (where LLM-as-judge is more appropriate), and note LLM-as-judge's own reliability limitations.", weak_answer_example: "\"I'd just use whichever is easier to set up\" — no task-appropriateness reasoning.", follow_up_question: "What's a specific limitation of LLM-as-judge evaluation you'd want to be aware of?" },
  { category: "scenario", order_index: 1, question: "Your team ships a prompt tweak to a production copilot without rerunning its evaluation flow, and quality quietly regresses. What process gap does this reveal?", what_is_tested: "Understanding of GenAIOps' continuous-evaluation discipline.", strong_answer_structure: "Identify that evaluation was treated as a one-time launch gate rather than a continuous check tied to every meaningful change, and propose making evaluation reruns a required step in the deployment process.", weak_answer_example: "Blaming the specific prompt change itself rather than the missing process.", follow_up_question: "How would you enforce that evaluation reruns actually happen on every change, rather than relying on memory?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "LLM Evaluation & Testing").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Azure AI Module 3 (Building & Evaluating Copilots) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
