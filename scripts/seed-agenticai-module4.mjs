import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "7ad98412-8371-441c-9302-832ce4376979"; // Multi-Agent Systems & Production Readiness

const sections = [
  {
    section_type: "the_field",
    title: "What shipping a multi-agent system with the guardrails a paying client would actually require looks like",
    order_index: 0,
    content: "This capstone brings the course's foundations (Module 1's classification discipline, Module 2's architecture blueprint, Module 3's grounding) to their practical, production-relevant conclusion: a supervisor/worker multi-agent system with real escalation handling, cost/latency guardrails, and production monitoring — the actual bar a paying client's real business would require, not a demo that happens to work once.\n\nSupervisor/worker patterns are the direct, framework-agnostic version of the manager/worker architecture established in the n8n and LangGraph course tracks — applying the same genuine-decomposition test from Module 1 before committing to this added coordination complexity. Escalation and failure handling, and cost/latency guardrails, are what separate a working demo from something a real client would trust with their business.",
  },
  {
    section_type: "mental_models",
    title: "How to think about multi-agent production readiness",
    order_index: 1,
    content: "**1. A supervisor/worker system is justified by genuine decomposition need, established in Module 1, not by production readiness being a separate reason to add coordination complexity.**\n\n**2. Escalation and failure handling need explicit design — what happens when a worker agent fails, or when the supervisor can't confidently synthesize a result — the same wrong-case-handling discipline established throughout this catalog.**\n\n**3. Cost and latency guardrails are real production requirements, not optional polish** — a multi-agent system's cost can scale unpredictably with the number of agent calls involved, and a client-facing system needs real limits.\n\n**4. Human override is what makes a production multi-agent system trustworthy, not just its individual agents' quality** — a real paying client needs a genuine, structural way to intervene, not just confidence in the agents' typical behavior.",
  },
  {
    section_type: "decision_framework",
    title: "What does production readiness actually require for a multi-agent system?",
    order_index: 2,
    content: "IF the task genuinely benefits from specialized decomposition (per Module 1's test) THEN a supervisor/worker architecture is justified — but this alone doesn't make it production-ready.\n\nIF a worker agent can fail or produce a low-confidence result THEN the supervisor needs explicit escalation logic — a defined fallback, not silent failure or a forced synthesis from insufficient input.\n\nIF the system will run against real, potentially high-volume traffic THEN cost and latency guardrails (limits, alerts, circuit breakers) need to be explicit, not assumed to stay reasonable.\n\nIF the system makes decisions with real business consequence THEN a genuine human override mechanism needs to exist and be structurally verified, not just designed on paper.",
  },
  {
    section_type: "workflow",
    title: "The real process for building a production-ready multi-agent system",
    order_index: 3,
    content: "1. Confirm the multi-agent decomposition is genuinely justified, per Module 1's test.\n\n2. Design each worker agent's blueprint (Module 2) and grounding (Module 3) individually.\n\n3. Design the supervisor's delegation and synthesis logic explicitly, including escalation handling for worker failure or low confidence.\n\n4. Implement structured decision logging across the full multi-agent flow.\n\n5. Add cost and latency guardrails — real limits, not aspirational targets.\n\n6. Implement and verify a genuine human override mechanism.\n\n7. Test the full system against realistic scenarios, including deliberate worker-failure and low-confidence cases.\n\n8. Deploy with monitoring specifically covering agent decisions, cost, and latency together.",
  },
  {
    section_type: "failure_modes",
    title: "How production multi-agent rollout actually goes wrong",
    order_index: 4,
    content: "Failure 1 — No escalation logic for worker agent failure, forcing the supervisor to synthesize from insufficient input.\nWhat: a worker agent fails or returns a low-confidence result, and the supervisor proceeds anyway, producing a confidently wrong final output.\nDetect: test the system with a deliberately failing worker and check whether the supervisor's response reflects that failure honestly or masks it.\nPrevent: design explicit escalation logic per this module's decision framework.\nInterview question: \"A worker agent in your multi-agent system fails to return a useful result. What should the supervisor do?\"\n\nFailure 2 — No cost or latency guardrails, letting a multi-agent system's real cost scale unpredictably.\nWhat: the system is deployed with no explicit cost/latency limits, and real usage causes unexpectedly high cost or slow response times, discovered only after the fact.\nDetect: check whether real-time cost/latency monitoring and limits exist, or whether they were assumed to stay reasonable.\nPrevent: implement explicit guardrails as a standard, required part of production deployment.\nInterview question: \"Why might a multi-agent system's cost scale less predictably than a single-agent system's?\"\n\nFailure 3 — A designed human override that isn't structurally verified to work.\nWhat: the system's documentation describes a human override mechanism, but it's never actually tested to confirm it genuinely halts or redirects the system when invoked.\nDetect: deliberately attempt to invoke the override and confirm it actually works.\nPrevent: test the override mechanism explicitly before considering the system production-ready, the same testing discipline established throughout this catalog.\nInterview question: \"How would you verify your multi-agent system's human override actually works, rather than just being documented?\"",
  },
  {
    section_type: "checklist",
    title: "Multi-Agent Production Readiness Checklist",
    order_index: 5,
    content: "- [ ] Multi-agent decomposition is genuinely justified, not decomposition for its own sake\n- [ ] Explicit escalation logic exists for worker failure or low-confidence results\n- [ ] Structured decision logging covers the full multi-agent flow\n- [ ] Cost and latency guardrails are explicit and enforced, not assumed\n- [ ] A human override mechanism is implemented and structurally verified to work\n- [ ] The system is tested against realistic failure scenarios, not just the happy path",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- The n8n course track's Module 5 and 6 (Knowledge, Enterprise Context & Multi-Agent Systems; Reliability, Governance & Monetization) — the direct, deeper reference for supervisor/worker patterns and production guardrails this module summarizes.\n- The LangChain/LangGraph course track's Module 4 (Multi-Agent Graphs & Evaluation) — direct reference for tracing and evaluation in a production multi-agent context.\n\nReference\n- The LLMOps course track's Module 3 (Deployment & Infrastructure) — direct reference for cost/latency monitoring discipline.",
  },
];

const exercises = [
  {
    level: "capstone",
    order_index: 0,
    title: "Capstone: a 2-3 agent team with logging and human override",
    problem_statement: "Build a 2-3 agent team (e.g., research → draft → review) for a real task. Implement structured decision logging across the full flow, explicit escalation handling for a deliberately failing worker, and a genuine, tested human override mechanism.\n\nDeliberately test the escalation logic (simulate a worker failure) and the human override (confirm it actually halts/redirects the system when invoked).",
    starter_context: "This capstone synthesizes the course's full arc — reuse your Module 1-3 work directly.",
    hints: [
      "The two deliberate tests (worker failure, human override) are the actual proof points this capstone requires, not optional additions.",
    ],
    solution_notes: "A strong capstone submission has a genuinely justified multi-agent system with real decision logging, and — critically — both the escalation logic and human override are actually tested and confirmed working, not just designed. Submissions that skip either deliberate test haven't met the actual bar this capstone requires.",
  },
];

const interviewQuestions = [
  { category: "project_defence", order_index: 0, question: "Walk me through your capstone's escalation logic test. What happened when a worker agent failed?", what_is_tested: "Whether escalation handling was actually tested, not just designed.", strong_answer_structure: "Describe the specific failure simulated and how the supervisor's response correctly reflected that failure rather than masking it with a forced synthesis.", weak_answer_example: "\"I designed escalation logic\" with no description of an actual test.", follow_up_question: "What would a paying client want to see about this escalation behavior?" },
  { category: "applied", order_index: 1, question: "Why might a multi-agent system's cost be harder to predict than a single-agent system's?", what_is_tested: "Understanding of multi-agent cost dynamics.", strong_answer_structure: "Explain that each additional agent call adds to real cost, and coordination overhead (delegation, synthesis) can multiply cost in ways that aren't linear or obvious without explicit monitoring.", weak_answer_example: "\"Cost is basically the same regardless of agent count\" — misses the real multiplicative cost dynamic.", follow_up_question: "What specific guardrail would you implement to catch a cost problem early?" },
  { category: "scenario", order_index: 2, question: "A client asks how they can intervene if your multi-agent system starts producing bad results. What do you show them?", what_is_tested: "Whether a genuine, verified human override exists.", strong_answer_structure: "Demonstrate the actual, tested override mechanism, not just describe an intended design.", weak_answer_example: "\"We'd add an override if needed\" — no existing, verified mechanism.", follow_up_question: "How would you prove to a skeptical client this override actually works?" },
  { category: "debugging", order_index: 3, question: "A multi-agent system's final output was confidently wrong. How do you find out which agent was responsible?", what_is_tested: "Application of decision-logging and layer-isolation discipline.", strong_answer_structure: "Use structured decision logs to trace the full flow, examining each agent's individual contribution rather than guessing from the final output alone.", weak_answer_example: "Guessing based on which agent seems most likely at fault, without actually checking the logs.", follow_up_question: "What would you do if the logs revealed a genuine escalation-logic gap?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "Multi-Agent Orchestration").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Agentic AI Module 4 (Multi-Agent Systems & Production Readiness) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
