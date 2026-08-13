import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "e468bd54-bfe8-4bca-9645-71cfaf9c0175"; // Building with Gemini

const sections = [
  {
    section_type: "the_field",
    title: "What building a real Gemini-powered feature via Vertex AI Studio actually involves",
    order_index: 0,
    content: "Vertex AI Studio is Google Cloud's console-based environment for prototyping with Gemini and other Model Garden models before writing production code against the Vertex AI SDK — it's where prompt design, parameter tuning, and multimodal experimentation happen fast, with the resulting prompt/config exportable directly into application code.\n\nThe build deliverable this module targets — a Gemini-powered feature via Vertex AI Studio — is the same general prompt-engineering-to-production workflow taught elsewhere in this catalog (see the Generative AI and AI Stack course tracks), applied specifically to Gemini's actual capabilities: strong multimodal input (text, image, video, audio together) and Google's function-calling and grounding integrations.",
  },
  {
    section_type: "mental_models",
    title: "How to think about building with Gemini specifically",
    order_index: 1,
    content: "**1. Gemini's real differentiator is native multimodality, not just being \"another large language model\"** — a feature that only uses text input is leaving a genuine capability advantage unused; the exercise below deliberately tests whether you can build something that actually uses it.\n\n**2. Vertex AI Studio's prompt/parameter configuration isn't throwaway prototyping — it exports directly to code**, so time spent tuning there is real production groundwork, not disposable exploration.\n\n**3. Grounding (connecting Gemini's output to a real, verifiable data source) is what separates a demo from something a client can trust** — the same anti-hallucination discipline taught throughout this catalog, here specifically via Vertex AI Search grounding or your own retrieval layer.\n\n**4. Gemini's context window is large enough to change the default architecture decision** — many tasks that would otherwise require a RAG pipeline can instead just place the relevant document directly in context, and knowing when that tradeoff is worth it is itself a real skill.",
  },
  {
    section_type: "decision_framework",
    title: "How to design a real Gemini feature",
    order_index: 2,
    content: "IF the feature's input is genuinely multimodal (an image, video, or audio input alongside text) THEN design the prompt and API call to use Gemini's native multimodal input directly, rather than converting everything to text first.\n\nIF the feature needs the output grounded in a specific, verifiable data source THEN use Vertex AI Search grounding (or a retrieval layer) rather than trusting the model's parametric knowledge.\n\nIF the relevant context fits comfortably within Gemini's context window and doesn't change often THEN placing it directly in context is a legitimate simpler alternative to a full RAG pipeline — don't default to RAG out of habit.\n\nIF the feature needs to trigger real actions (not just generate text) THEN use Gemini's function-calling, with the same schema-validation discipline taught in this catalog's agent-focused courses.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this module's build deliverable",
    order_index: 3,
    content: "1. In Vertex AI Studio, prototype the feature's core prompt against Gemini, iterating on wording and parameters (temperature, top-p) until the output is reliably useful.\n\n2. If the feature is genuinely multimodal, test it directly with real image/video/audio input in Vertex AI Studio, not just text.\n\n3. Decide, using this module's decision framework, whether the feature needs grounding or a RAG layer, or whether in-context placement is sufficient.\n\n4. Export the tuned prompt/configuration from Vertex AI Studio into real application code using the Vertex AI SDK.\n\n5. Call the deployed feature end-to-end and confirm the output matches what was seen in Vertex AI Studio.\n\n6. Write one paragraph on which Gemini-specific capability (multimodality, grounding, large context, function-calling) your feature actually relies on, and why it was the right fit.",
  },
  {
    section_type: "failure_modes",
    title: "Where building with Gemini actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Building a Gemini feature that never actually uses multimodal input, defeating the point of choosing Gemini.\nWhat: the feature converts everything to text before calling Gemini, getting no benefit over a text-only model, while adding Vertex AI-specific complexity for no real gain.\nDetect: check whether the feature's real input includes anything beyond text, and if so, whether it's passed to Gemini directly or converted first.\nPrevent: design for native multimodal input from the start when the task genuinely has it, per this module's decision framework.\nInterview question: \"What would make you choose Gemini over a text-only model for a given feature?\"\n\nFailure 2 — Defaulting to a full RAG pipeline when the relevant context would fit directly in Gemini's large context window.\nWhat: significant RAG-infrastructure effort (chunking, embedding, vector store) is spent on a task where the actual source document(s) would have fit directly in context, adding complexity without a corresponding benefit.\nDetect: check the actual size of the relevant context against Gemini's context window before designing a RAG layer.\nPrevent: apply this module's decision framework — in-context placement is a legitimate default when it fits and the content doesn't change often.\nInterview question: \"When would you skip RAG and just put the document directly in Gemini's context?\"",
  },
  {
    section_type: "checklist",
    title: "Gemini Feature Build Checklist",
    order_index: 5,
    content: "- [ ] Prompt/parameters tuned and validated in Vertex AI Studio before writing production code\n- [ ] If the task is genuinely multimodal, native multimodal input is actually used, not converted to text first\n- [ ] Grounding vs. in-context vs. RAG decision made deliberately, using this module's decision framework, not by default habit\n- [ ] Tuned configuration exported from Vertex AI Studio into real Vertex AI SDK application code\n- [ ] End-to-end output confirmed to match what was validated in Vertex AI Studio\n- [ ] Can articulate which specific Gemini capability the feature relies on and why it was the right fit",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Google Cloud's official Vertex AI Studio documentation — direct reference for the prototyping-to-production export workflow this module covers.\n- Vertex AI's Gemini API reference, multimodal input section — direct reference for building the multimodal half of this module's build deliverable.\n\nReference\n- The Generative AI course track's Module 1 (Prompt Engineering as a Practiced Discipline) — direct reference for the prompt-tuning discipline applied here to Gemini specifically.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Build a real Gemini-powered feature via Vertex AI Studio",
    problem_statement: "Prototype a real feature's prompt in Vertex AI Studio, using genuinely multimodal input if the task calls for it. Export the tuned configuration to real application code via the Vertex AI SDK, and confirm the deployed feature's output matches what you validated in Studio.",
    starter_context: "This matches this module's stated build deliverable exactly.",
    hints: [
      "If your feature's real input is only ever text, reconsider whether Gemini's multimodal strength is the right differentiator for this specific feature.",
    ],
    solution_notes: "A strong submission has a working end-to-end feature (Studio prototype to deployed code) and a clear, specific rationale for which Gemini capability it relies on — not just \"it uses Gemini.\"",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Decide: grounding, RAG, or in-context for three scenarios",
    problem_statement: "Given three short feature descriptions (write your own — one with frequently changing external data, one with a single static reference document that's short enough to fit in context, one needing verifiable citations from a large document set), decide the right context strategy for each using this module's decision framework.",
    starter_context: null,
    hints: [
      "The static, short reference-document scenario is the one most people over-engineer with RAG by default — check it against Gemini's actual context window size.",
    ],
    solution_notes: "A strong submission picks a different strategy for at least two of the three scenarios and justifies each against the specific data characteristics (size, change frequency, verifiability need) rather than a one-size-fits-all default.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What's Gemini's real differentiator compared to a text-only foundation model?", what_is_tested: "Understanding of Gemini's actual practical advantage.", strong_answer_structure: "Explain native multimodal input (text, image, video, audio together) as the core differentiator, plus a large context window that changes some architecture defaults.", weak_answer_example: "\"It's Google's version of GPT\" — no real differentiation named.", follow_up_question: "Give an example of a feature that genuinely needs multimodal input, versus one that doesn't." },
  { category: "applied", order_index: 1, question: "A client wants a feature that answers questions about a single 20-page policy document that rarely changes. Would you build a RAG pipeline for this on Vertex AI?", what_is_tested: "Applied judgment on when RAG is and isn't justified, given Gemini's large context window.", strong_answer_structure: "Explain that a 20-page document likely fits comfortably in Gemini's context window, so placing it directly in context is simpler and likely sufficient — reserving RAG for larger, more dynamic corpora.", weak_answer_example: "Defaulting to building a RAG pipeline without checking whether the document actually needs it.", follow_up_question: "At what point would you reconsider and move to a RAG-based approach?" },
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

console.log("GCP AI Module 2 (Building with Gemini) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
