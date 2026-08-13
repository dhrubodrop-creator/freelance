import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "166a0a71-db3a-4e28-b134-a9f6e57df256"; // Agent Architecture & Reasoning Patterns

const sections = [
  {
    section_type: "the_field",
    title: "What designing an agent's control loop before writing code actually looks like",
    order_index: 0,
    content: "The four components — goal, memory, tools, constraints — are the same Agent Design Document framework established in the n8n course track, presented here as framework-agnostic architecture. Before any implementation, a well-scoped agent has explicit answers to all four: what is it actually trying to achieve, what does it need to remember and for how long, what real capabilities does it have, and what must it never do.\n\nReAct (reason-then-act, repeated) and plan-and-execute are the two dominant reasoning-loop patterns, and choosing between them is a real architectural decision: ReAct interleaves reasoning and action step by step, adapting as new information arrives; plan-and-execute commits to a fuller plan upfront, then executes it, revisiting only when necessary. Neither is universally better — the choice depends on how much the task genuinely benefits from step-by-step adaptation versus upfront planning stability.\n\nReflection and self-correction, and human-in-the-loop checkpoints, are the two mechanisms that keep an agent's reasoning loop from either compounding its own errors unchecked or acting on a consequential decision with no oversight — both connect directly to the risk-based human-in-the-loop principle established throughout this catalog.",
  },
  {
    section_type: "mental_models",
    title: "How to think about agent architecture and reasoning loops",
    order_index: 1,
    content: "**1. Goal, memory, tools, and constraints aren't implementation details — they're the actual design, and skipping any of them means the design isn't complete.**\n\n**2. ReAct and plan-and-execute trade off adaptability against planning stability, and the right choice depends on the task, not a default preference.** A task with high uncertainty about what will actually be needed favors ReAct's step-by-step adaptation; a task with a clear, well-understood sequence favors plan-and-execute's upfront commitment.\n\n**3. Reflection lets an agent catch its own errors before they compound, but it's not a substitute for external verification** — a reflecting agent can still be confidently wrong about its own mistakes.\n\n**4. A human-in-the-loop checkpoint is a designed part of the control loop, not a fallback bolted on after the fact.** Where it belongs should be decided during architecture design, tied to the actual consequence of the action at that point in the loop.",
  },
  {
    section_type: "decision_framework",
    title: "How should I choose between ReAct and plan-and-execute, and where do checkpoints belong?",
    order_index: 2,
    content: "IF the task's actual requirements become clearer only as the agent gathers information (a research task, a diagnostic task) THEN ReAct's step-by-step reason-then-act loop is usually the better fit. BECAUSE it lets the agent adapt its next step based on what it just learned, rather than committing to a plan before that information is available.\n\nIF the task's overall shape is well-understood upfront, with a clear sequence of steps THEN plan-and-execute, committing to a fuller plan before acting, is usually more efficient and predictable. BECAUSE there's less genuine need for step-by-step adaptation, and a stable upfront plan is easier to review and reason about.\n\nIF a step in the loop could produce a consequential, hard-to-reverse outcome THEN place a human-in-the-loop checkpoint there explicitly, during architecture design — not as an afterthought. BECAUSE this connects directly to the risk-based human-in-the-loop principle established throughout this catalog, and needs to be a deliberate part of the control loop's design.\n\nIF the agent's reasoning could plausibly compound an early error across several steps THEN build in reflection/self-correction checkpoints, while recognizing this doesn't replace genuine external verification for high-stakes decisions.",
  },
  {
    section_type: "workflow",
    title: "The real process for architecting an agent's control loop",
    order_index: 3,
    content: "1. Define the four components explicitly — goal, memory, tools, constraints — as the Agent Design Blueprint.\n\n2. Choose ReAct or plan-and-execute based on how much the task genuinely benefits from step-by-step adaptation versus upfront planning stability.\n\n3. Identify every point in the loop with real-world consequence, and design a human-in-the-loop checkpoint there.\n\n4. Add reflection/self-correction where error-compounding risk is real, without treating it as a substitute for the checkpoints from step 3.\n\n5. Document the full blueprint before writing implementation code.\n\n6. Review the blueprint specifically for any consequential step that lacks a checkpoint.",
  },
  {
    section_type: "failure_modes",
    title: "How agent architecture design actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Skipping explicit constraint definition, leaving the agent's boundaries implicit.\nWhat: goal, memory, and tools are defined, but constraints (what the agent must never do) are left unstated, discovered only when the agent does something unintended.\nDetect: check whether the blueprint has an explicit constraints section, or only positive capability description.\nPrevent: require all four components explicitly, per this module's workflow.\nInterview question: \"Your agent design document defines goal, memory, and tools but not constraints. What's the risk?\"\n\nFailure 2 — Choosing ReAct or plan-and-execute by default rather than genuine task fit.\nWhat: one reasoning pattern is used for every agent regardless of whether the specific task actually benefits from its trade-offs.\nDetect: check whether the pattern choice was reasoned against the task's actual adaptability needs, or just a habitual default.\nPrevent: apply this module's decision framework deliberately for each new agent design.\nInterview question: \"Why might plan-and-execute be a better fit than ReAct for a well-understood, sequential task?\"\n\nFailure 3 — Adding human-in-the-loop checkpoints reactively, after an incident, instead of during initial architecture design.\nWhat: consequential steps in the control loop have no checkpoint until a real problem occurs, at which point one gets added retroactively.\nDetect: check whether checkpoint placement was a deliberate part of the original architecture, or added only after an incident.\nPrevent: identify every consequential step during initial design, per this module's workflow, not after the fact.\nInterview question: \"How would you decide where human-in-the-loop checkpoints belong before an agent is ever deployed?\"",
  },
  {
    section_type: "checklist",
    title: "Agent Architecture Blueprint Checklist",
    order_index: 5,
    content: "- [ ] Goal, memory, tools, and constraints are all explicitly defined\n- [ ] The reasoning pattern (ReAct vs. plan-and-execute) is chosen based on genuine task fit\n- [ ] Every consequential step has a designed human-in-the-loop checkpoint\n- [ ] Reflection/self-correction is used where error-compounding risk is real, not as a substitute for checkpoints\n- [ ] The full blueprint is documented before implementation begins",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Yao et al., [\"ReAct: Synergizing Reasoning and Acting in Language Models\"](https://arxiv.org/abs/2210.03629) (2022) — the foundational research paper for the ReAct pattern this module covers.\n- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) (referenced in the LangChain/LangGraph course track) — a concrete implementation reference for both ReAct and plan-and-execute patterns.\n\nReference\n- The n8n course track's Module 1 (Agentic System Design Mindset) — the direct source of the goal/memory/tools/constraints framework this module applies.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Design an Agent Architecture Blueprint (v1) for a real workflow",
    problem_statement: "Choose a real workflow (research, customer triage, content drafting — your choice). Design a complete Agent Architecture Blueprint: goal, memory, tools, constraints, chosen reasoning pattern with justification, and at least one designed human-in-the-loop checkpoint.",
    starter_context: "Choose a workflow with genuine complexity — enough real steps and consequence to make the design decisions meaningful.",
    hints: [
      "Justify your ReAct vs. plan-and-execute choice explicitly against your specific workflow's actual characteristics, not a default preference.",
    ],
    solution_notes: "A strong submission has all four components genuinely defined (including real, specific constraints, not just capabilities), a reasoning-pattern choice with real justification tied to the workflow's actual adaptability needs, and at least one checkpoint placed at a genuinely consequential step.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Diagnose a blueprint missing constraints and checkpoints",
    problem_statement: "You're given an agent blueprint that defines goal ('help users book travel'), memory ('remembers conversation context'), and tools ('flight search API, booking API'), but has no constraints section and no human-in-the-loop checkpoints. Identify the specific risks this creates and propose fixes.",
    starter_context: "Consider the actual real-world consequence of the booking API tool specifically.",
    hints: [
      "A booking action has real financial consequence — what constraint and checkpoint would you add specifically around it?",
    ],
    solution_notes: "A strong submission identifies the booking API as the specific consequential action needing both an explicit constraint (e.g., a spending limit, never booking without explicit confirmation) and a human-in-the-loop checkpoint before execution, directly closing this module's most common failure gap.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What are the four core components of an agent's design, and why does skipping any of them matter?", what_is_tested: "Understanding of the goal/memory/tools/constraints framework.", strong_answer_structure: "Name all four and explain that constraints specifically are often skipped, leaving the agent's boundaries implicit and only discovered when something goes wrong.", weak_answer_example: "\"An agent just needs a good prompt\" — misses the structured design framework.", follow_up_question: "Give an example of a constraint that should be explicit for a customer-facing agent." },
  { category: "applied", order_index: 1, question: "When would you choose plan-and-execute over ReAct for an agent's reasoning loop?", what_is_tested: "Genuine task-fit reasoning for the two patterns.", strong_answer_structure: "Explain choosing plan-and-execute when the task's shape is well-understood upfront with a clear sequence, versus ReAct when requirements only become clear as information is gathered.", weak_answer_example: "\"I'd always use ReAct since it's more flexible\" — defaults without task-specific reasoning.", follow_up_question: "What's the downside of using ReAct for a well-understood, sequential task?" },
  { category: "scenario", order_index: 2, question: "You're designing an agent that can send emails on a user's behalf. Where does a human-in-the-loop checkpoint belong?", what_is_tested: "Application of consequence-based checkpoint placement.", strong_answer_structure: "Place the checkpoint before the email actually sends, given the real, hard-to-reverse consequence of that action.", weak_answer_example: "\"Checkpoints aren't really necessary if the agent is well-tested\" — dismisses the value of a structural safety check.", follow_up_question: "Would every email-related action need this checkpoint, or just some?" },
  { category: "debugging", order_index: 3, question: "An agent using reflection to self-correct keeps confidently repeating the same category of mistake. What does this suggest?", what_is_tested: "Understanding that reflection isn't a substitute for external verification.", strong_answer_structure: "Explain that reflection helps an agent catch some errors but doesn't guarantee catching its own systematic blind spots — external verification or a different checkpoint is needed for this category of mistake.", weak_answer_example: "\"Just add more reflection prompting\" — assumes more of the same mechanism will fix a fundamental limitation of that mechanism.", follow_up_question: "What would you add instead of more reflection?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "Agent Architecture Design").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Agentic AI Module 2 (Agent Architecture & Reasoning Patterns) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
