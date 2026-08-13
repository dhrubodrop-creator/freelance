import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "dc60e770-02f6-48e9-a1ff-ef30c980b43b"; // Tools, Memory & Grounding

const sections = [
  {
    section_type: "the_field",
    title: "What shipping an agent that reasons over real data, not a static prompt wearing a costume, actually looks like",
    order_index: 0,
    content: "A demo agent that only ever answers from the model's general training knowledge, dressed up with agent-like framing (a persona, a role description), is a prompt wearing a costume — it isn't actually reasoning over anything real. This module is about the concrete techniques that make an agent genuinely grounded: real tool-calling into real APIs, real memory management, and real grounding against actual retrieved data, connecting directly to the tool-calling and RAG disciplines established in the LangChain and n8n course tracks.\n\nShort-term versus long-term memory is a real, distinct architectural decision, not an assumption that state \"just carries over\": memory within a single agent execution doesn't automatically persist across separate sessions, and building for genuine long-term memory requires deliberate persistence design.\n\nConnecting to real APIs and reducing hallucination through grounding are the two techniques that turn an agent from a costume into something that actually reasons over real, current information — the same tool-calling and grounding disciplines this catalog's engineering-focused courses build in much greater depth, presented here as the foundational conceptual grounding.",
  },
  {
    section_type: "mental_models",
    title: "How to think about tools, memory, and grounding",
    order_index: 1,
    content: "**1. Tool access should be scoped to exactly what the agent's real, validated task requires** — the least-privilege principle established throughout this catalog.\n\n**2. Short-term and long-term memory are different mechanisms serving different needs, and assuming one behaves like the other is a real, common bug source.** State within one execution doesn't automatically persist across sessions without deliberate design.\n\n**3. Grounding means the agent's claims trace back to real, retrieved data — not that it merely has access to a tool that could theoretically be called.** An agent with tool access it doesn't actually use for a given claim is still hallucinating, just with a tool sitting unused nearby.\n\n**4. A research agent's real value is specifically in connecting reasoning to real, current data a static prompt can't have** — this is the actual differentiator this module's build deliverable is designed to demonstrate.",
  },
  {
    section_type: "decision_framework",
    title: "How should I design tool access, memory, and grounding for a research/analysis agent?",
    order_index: 2,
    content: "IF the agent needs to answer questions about current or specific real-world data THEN it needs actual tool-calling into a real API or data source — not reliance on the model's general training knowledge, which is neither current nor necessarily accurate for specific facts.\n\nIF the agent needs to remember something across multiple separate user sessions THEN this requires deliberate long-term memory persistence design, not an assumption that short-term execution state will carry over.\n\nIF the agent makes a factual claim THEN it should be traceable to an actual tool call or retrieved data point, not generated from general pattern-matching — this is the practical grounding test for this module's build deliverable.\n\nIF tool access is being granted THEN scope it narrowly to the agent's actual validated task, applying least-privilege, per the principle established throughout this catalog's agent-focused courses.",
  },
  {
    section_type: "workflow",
    title: "The real process for building a tool-grounded research agent",
    order_index: 3,
    content: "1. Identify the real API or data source the agent's task genuinely requires.\n\n2. Define the tool's function schema explicitly, scoped to exactly what's needed.\n\n3. Decide the memory scope (short-term within-session versus long-term across-session) deliberately, based on the actual task requirement.\n\n4. Wire the agent's instructions to require it to use the tool for factual claims, not rely on general knowledge.\n\n5. Test with questions specifically requiring current or specific data the model's general knowledge wouldn't have, confirming the agent actually calls the tool rather than guessing.\n\n6. Verify at least one claim in the agent's output traces back to an actual tool call result.",
  },
  {
    section_type: "failure_modes",
    title: "How tool-grounded agent building actually goes wrong",
    order_index: 4,
    content: "Failure 1 — An agent with tool access that still answers from general knowledge instead of using the tool.\nWhat: the agent has a real tool available but its instructions don't require using it for factual claims, so it defaults to pattern-matched general knowledge, producing a costume-agent rather than a genuinely grounded one.\nDetect: test with a question the tool would answer differently from the model's general knowledge, and check which answer the agent actually gives.\nPrevent: explicitly instruct the agent to use the tool for factual claims, per this module's workflow, and verify this behavior directly.\nInterview question: \"Your agent has access to a live pricing API but sometimes states outdated prices. What's the likely cause?\"\n\nFailure 2 — Assuming short-term execution memory persists across separate sessions.\nWhat: state that was only ever short-term (scoped to one execution) is assumed to carry over to a later, separate session, and the agent appears to \"forget\" things it was never actually designed to remember long-term.\nDetect: test the agent across genuinely separate invocations, not just within one continuous run.\nPrevent: explicitly decide and implement the memory scope needed, per this module's decision framework, rather than assuming persistence.\nInterview question: \"A user says your agent 'forgot' something from a previous conversation. What's your first hypothesis?\"\n\nFailure 3 — Overly broad tool access granted speculatively.\nWhat: the agent is given more API access than its actual validated task requires, increasing the blast radius of any mistake or manipulation for no real benefit.\nDetect: audit granted tool access against the agent's actual, current real task scope.\nPrevent: apply least-privilege scoping deliberately, per this module's decision framework.\nInterview question: \"Why might granting an agent broad API access 'just in case' be a real risk, even if it never misuses that access?\"",
  },
  {
    section_type: "checklist",
    title: "Tool-Grounded Agent Checklist",
    order_index: 5,
    content: "- [ ] Tool access is real (a genuine API/data source), not just conceptual\n- [ ] Tool access is scoped narrowly to the agent's actual validated task\n- [ ] Memory scope (short-term vs. long-term) is a deliberate decision, not an assumption\n- [ ] The agent's instructions require using the tool for factual claims, not relying on general knowledge\n- [ ] At least one output claim has been verified to trace back to an actual tool call result",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- The LangChain/LangGraph course track's Module 2 (Tool Calling & RAG) — the direct, deeper technical reference for tool-calling and grounding this module introduces conceptually.\n- The LangGraph course track's Module 3 (LangGraph Orchestration) — direct reference for short-term vs. long-term memory implementation.\n\nReference\n- [LangChain: Tool calling](https://python.langchain.com/docs/concepts/tool_calling/) (referenced across this catalog) — the direct technical reference for function schema design.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Build a research + analysis agent wired to a real API",
    problem_statement: "Build an agent with access to one real, public API (a weather API, a public data API — your choice). Ask it 3 questions requiring current or specific data the model's general knowledge wouldn't reliably have, and verify each answer traces back to an actual API call, not general pattern-matching.",
    starter_context: "Choose an API and questions where the correct answer would genuinely differ from a model's general-knowledge guess.",
    hints: [
      "If any answer doesn't clearly trace to a real tool call, investigate whether your instructions actually require tool use for this kind of question.",
    ],
    solution_notes: "A strong submission has a genuinely working tool-calling agent, and explicitly verifies (not just assumes) that each of the 3 answers traces back to a real API call result — directly demonstrating the grounding-not-costume distinction this module's core lesson is built around.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Diagnose a memory-scope mismatch",
    problem_statement: "You're told: \"Our agent is supposed to remember a user's stated preferences across sessions, but it doesn't seem to.\" Diagnose the likely cause and propose a fix.",
    starter_context: "Reason through what memory mechanism was likely implemented versus what was actually needed.",
    hints: [
      "Consider whether the original implementation only ever had short-term, within-execution memory, with no genuine long-term persistence mechanism.",
    ],
    solution_notes: "A strong submission correctly diagnoses that the agent likely only has short-term execution memory with no deliberate long-term persistence, and proposes implementing genuine cross-session storage — directly applying this module's second failure mode.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "Why might an agent with real tool access still produce ungrounded, hallucinated answers?", what_is_tested: "Understanding that tool access alone doesn't guarantee grounding.", strong_answer_structure: "Explain that if the agent's instructions don't require it to actually use the tool for factual claims, it can still default to pattern-matched general knowledge despite having tool access available.", weak_answer_example: "\"If it has the tool, it should use it\" — assumes tool availability guarantees tool usage.", follow_up_question: "How would you verify an agent is actually using its tools for factual claims?" },
  { category: "applied", order_index: 1, question: "How would you decide whether an agent needs short-term or long-term memory?", what_is_tested: "Practical distinction between the two memory scopes.", strong_answer_structure: "Explain checking whether the state needs to persist only within one execution, or genuinely across separate sessions — and implementing accordingly rather than assuming.", weak_answer_example: "\"Memory just works automatically\" — misses that persistence across sessions requires deliberate design.", follow_up_question: "What mechanism would you use to implement genuine long-term memory?" },
  { category: "scenario", order_index: 2, question: "An agent has broad access to your company's internal APIs 'in case it needs them.' What's your concern?", what_is_tested: "Application of least-privilege scoping.", strong_answer_structure: "Express concern that this increases the blast radius of any mistake or manipulation without corresponding benefit, and recommend scoping access to the agent's actual validated task.", weak_answer_example: "\"That's fine as long as the agent behaves well\" — accepts unnecessary risk based on assumed good behavior.", follow_up_question: "How would you decide what access is genuinely needed versus speculative?" },
  { category: "debugging", order_index: 3, question: "A user reports your agent 'forgot' something from a previous session. What's your first hypothesis?", what_is_tested: "Diagnostic instinct toward the short-term-vs-long-term memory distinction.", strong_answer_structure: "Hypothesize that the relevant state was only ever short-term, scoped to a single execution, with no deliberate long-term persistence implemented.", weak_answer_example: "Assuming this is a general reliability bug without considering the memory-scope distinction specifically.", follow_up_question: "How would you fix this if long-term memory genuinely is needed for this use case?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "Tool-Calling & Function Schemas").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("Agentic AI Module 3 (Tools, Memory & Grounding) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
