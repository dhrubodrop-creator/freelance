import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "93531088-a83f-4fc9-a002-ae51773bdd32"; // Agentic Systems Foundations

const sections = [
  {
    section_type: "the_field",
    title: "What telling a true agent from a scripted bot actually looks like",
    order_index: 0,
    content: "\"Agentic AI\" has become a marketing label applied to almost anything that calls an LLM, which means the actual, useful distinction — is this system genuinely reasoning and adapting, or is it a fixed script with an AI-generated response bolted on — gets lost. This course is tool- and framework-agnostic on purpose: the conceptual foundations here apply whether you eventually build with LangGraph, n8n, or a custom implementation, and getting these foundations right is what makes any of those frameworks usable well rather than as an expensive way to build something a simple script would have done better.\n\nThe deterministic-vs-agentic distinction, single-vs-multi-agent architecture, and chatbot-vs-tool-using-agent framing are the same core judgment established throughout this catalog's other agent-focused courses, presented here as the standalone conceptual grounding: automation and agentic AI solve genuinely different problems, and defaulting to the more sophisticated one is a real, avoidable cost. A chatbot answers from what it knows; a tool-using agent takes real actions with real consequences — conflating the two is where a lot of overpromised \"AI agent\" projects actually go wrong.\n\nMapping real business scenarios against these distinctions is the practical skill this module builds: being able to look at a proposed use case and correctly classify what it actually needs, before any framework or implementation decision gets made.",
  },
  {
    section_type: "mental_models",
    title: "How to think about agentic systems foundationally",
    order_index: 1,
    content: "**1. Automation and agentic AI solve different problems — reach for the more sophisticated one only when the task genuinely requires reasoning under ambiguity, not by default.** This is the single most important, most commonly violated principle across every real \"AI agent\" project.\n\n**2. A chatbot and a tool-using agent are architecturally different, not just conversationally different.** A chatbot's worst-case failure is a bad answer; a tool-using agent's worst-case failure is a bad real-world action — these carry genuinely different stakes and deserve genuinely different design rigor.\n\n**3. Multi-agent systems trade single-agent simplicity for genuine task decomposition, and this trade-off needs to be earned, not assumed.** A task that a single, well-designed agent could handle doesn't automatically benefit from being split across multiple agents.\n\n**4. \"Reasoning system\" means the agent's actual behavior can vary meaningfully based on context and judgment, not just that an LLM was involved somewhere in the pipeline.** A workflow that always does the same thing regardless of context isn't reasoning, no matter what model powers it.",
  },
  {
    section_type: "decision_framework",
    title: "Is this business scenario a genuine agentic use case?",
    order_index: 2,
    content: "IF the task has a fixed, reliably scriptable answer for a given input THEN it's deterministic automation, not an agentic use case, regardless of how the pitch frames it. BECAUSE reaching for agentic reasoning here adds cost and unpredictability with no genuine benefit — this is the foundational distinction established throughout this catalog's agentic-design modules.\n\nIF the task requires genuine judgment under ambiguity — synthesizing multiple signals, handling cases a fixed rule set can't anticipate — THEN it's a real agentic candidate. BECAUSE this is exactly where reasoning-based systems add value a script structurally can't.\n\nIF the proposed agent needs to take real, consequential actions (not just generate text) THEN treat this as a tool-using agent with correspondingly higher design stakes — access scoping, approval gates — not a chatbot with extra steps.\n\nIF a task seems to require multiple distinct specialized capabilities THEN check whether a single, well-instructed agent could handle it before defaulting to a multi-agent architecture — the added coordination complexity needs to be earned by genuine decomposition need.",
  },
  {
    section_type: "workflow",
    title: "The real process for scoping an agentic use case",
    order_index: 3,
    content: "1. State the actual business scenario in plain language, without using the word \"agent\" yet.\n\n2. Classify it: deterministic automation, chatbot, tool-using agent, or multi-agent — using this module's decision framework.\n\n3. For any tool-using classification, identify the real-world consequence of the actions involved.\n\n4. For any multi-agent classification, explicitly justify why a single agent wouldn't suffice.\n\n5. Document the classification and reasoning before any framework or implementation decision is made.\n\n6. Revisit the classification if the scenario's real requirements become clearer during design — an initial classification isn't necessarily final.",
  },
  {
    section_type: "failure_modes",
    title: "How agentic-use-case classification actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Labeling a deterministic process \"agentic\" because it uses an LLM somewhere.\nWhat: a fixed-logic process gets an LLM call inserted and is marketed or designed as an \"agent,\" when the underlying task never actually required reasoning.\nDetect: check whether the system's behavior would meaningfully change given different context, or whether it always produces essentially the same kind of output regardless.\nPrevent: apply the deterministic-vs-agentic classification honestly before any implementation, per this module's decision framework.\nInterview question: \"A workflow calls an LLM to format a response but the actual logic is entirely fixed rules. Is this an agent?\"\n\nFailure 2 — Treating a tool-using agent's design stakes the same as a pure chatbot's.\nWhat: an agent that takes real actions is designed with the same casual rigor as a text-only chatbot, missing the access-scoping and approval-gate considerations its real consequences warrant.\nDetect: check whether the agent's actual action-taking capability was factored into its design rigor, or only its conversational quality.\nPrevent: explicitly elevate design rigor for any agent with real tool access, per this module's decision framework.\nInterview question: \"How should the design process differ between a chatbot and a tool-using agent with the same underlying model?\"\n\nFailure 3 — Defaulting to multi-agent architecture without a genuine decomposition justification.\nWhat: a multi-agent system is built for a task a single, well-instructed agent could have handled, adding unnecessary coordination complexity.\nDetect: check whether a single-agent alternative was genuinely considered and ruled out, or multi-agent was the default starting point.\nPrevent: require explicit justification for multi-agent architecture, per this module's decision framework.\nInterview question: \"When would you choose a single agent over a multi-agent system, even for a moderately complex task?\"",
  },
  {
    section_type: "checklist",
    title: "Agentic Use Case Classification Checklist",
    order_index: 5,
    content: "- [ ] The scenario is described in plain language before applying any \"agent\" framing\n- [ ] Deterministic-vs-agentic classification is based on genuine reasoning need, not default preference\n- [ ] Tool-using agent classifications account for real-world action consequence in design rigor\n- [ ] Multi-agent classifications have explicit, genuine decomposition justification\n- [ ] The classification is documented before framework/implementation decisions are made",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- The n8n course track's Module 1 (Agentic System Design Mindset) — the direct, deeper foundational reference for the deterministic-vs-agentic framework this module is built on.\n- [Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents) (referenced across this catalog) — the authoritative reference on when agentic complexity is and isn't warranted.\n\nReference\n- The LangChain/LangGraph course track's Module 4 (Multi-Agent Graphs & Evaluation) — direct reference for the multi-agent decomposition test this module introduces conceptually.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Map 3 agent use cases in a chosen business domain",
    problem_statement: "Choose a business domain (customer support, sales, internal operations — your choice). Identify 3 candidate use cases and classify each as deterministic automation, chatbot, tool-using agent, or multi-agent, with explicit reasoning for each.",
    starter_context: "Choose genuinely varied use cases across the classification spectrum, not three that all land in the same category.",
    hints: [
      "Include at least one case you initially assume is agentic but, on closer inspection, is actually better served by deterministic automation.",
    ],
    solution_notes: "A strong submission produces three genuinely distinct classifications with real reasoning, including honest reclassification of an initially-assumed-agentic case if the analysis reveals it's actually deterministic — demonstrating genuine application of this module's decision framework rather than forcing all three into an \"agentic\" label.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Justify or reject a multi-agent design",
    problem_statement: "A colleague proposes a 4-agent system (research, draft, review, format) for generating a weekly internal newsletter. Assess whether this genuinely warrants multi-agent architecture, or whether a single, well-instructed agent (or fewer agents) would suffice.",
    starter_context: "Reason through each of the 4 proposed agent roles individually against the genuine-decomposition test.",
    hints: [
      "Consider whether 'format' genuinely requires a distinct agent, or is better handled as deterministic post-processing.",
    ],
    solution_notes: "A strong submission likely finds that 'format' doesn't warrant its own agent (better as deterministic logic), and reasons carefully about whether 'research,' 'draft,' and 'review' are genuinely distinct enough to justify separate agents versus a smaller number handling this task — with real reasoning, not an assumed conclusion.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What's the practical difference between automation and agentic AI?", what_is_tested: "Core conceptual understanding.", strong_answer_structure: "Explain that automation follows fixed logic while agentic AI involves genuine reasoning under ambiguity — and that choosing between them should be deliberate, not automatic.", weak_answer_example: "\"Agentic just means using AI\" — no real distinction drawn.", follow_up_question: "Give an example of a task that looks complex but is actually a good automation candidate." },
  { category: "applied", order_index: 1, question: "How would you decide whether a proposed 'AI agent' project actually needs agentic reasoning?", what_is_tested: "Practical application of the classification framework.", strong_answer_structure: "Describe checking whether the task requires genuine judgment under ambiguity versus having a fixed, scriptable answer.", weak_answer_example: "\"If it uses an LLM, it's an agent\" — conflates model usage with genuine reasoning need.", follow_up_question: "What would you tell a stakeholder who insists on calling a scripted workflow an 'AI agent'?" },
  { category: "scenario", order_index: 2, question: "You're asked to build a multi-agent customer support system. What's your first question?", what_is_tested: "Instinct to check genuine decomposition need before defaulting to multi-agent complexity.", strong_answer_structure: "Ask whether a single, well-instructed agent could handle the task, and what specifically necessitates splitting it across multiple agents.", weak_answer_example: "\"How many agents do you want?\" — accepts the multi-agent premise without questioning it.", follow_up_question: "What evidence would convince you multi-agent is genuinely justified here?" },
  { category: "behavioural", order_index: 3, question: "Describe a time you had to push back on labeling something 'AI' or 'agentic' when it wasn't really.", what_is_tested: "Real or realistic experience with honest technical framing.", strong_answer_structure: "A specific example with the actual pushback and its reasoning described concretely.", weak_answer_example: "A vague, generic answer with no specific instance.", follow_up_question: "How was that pushback received?" },
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

console.log("Agentic AI Module 1 (Agentic Systems Foundations) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
