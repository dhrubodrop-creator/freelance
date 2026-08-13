import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "3799b04e-d39d-4764-85b3-4433a5e7b305"; // Azure AI Services & Microsoft Foundry

const sections = [
  {
    section_type: "the_field",
    title: "What actually deploying and calling an Azure OpenAI model from Microsoft Foundry involves",
    order_index: 0,
    content: "Azure AI Services is Microsoft's collection of purpose-built, pretrained AI APIs (Language, Vision, Speech, Document Intelligence — the Azure equivalents of AWS's Comprehend/Textract/Rekognition family). Microsoft Foundry (formerly Azure AI Foundry) is Microsoft's unified console and SDK for building with foundation models, including Azure OpenAI Service — the managed, enterprise-grade access point for OpenAI's models on Azure infrastructure.\n\nThe build deliverable — deploy and call an Azure OpenAI model from Microsoft Foundry — mirrors AWS Bedrock's managed-foundation-model workflow (see the AWS AI course's Module 2) and GCP's Vertex AI Studio workflow (see the GCP AI course's Module 2), but Azure's specific twist is its deployment-types model: choosing between Standard, Global Standard, and Provisioned Throughput deployments has real, exam-tested cost and reliability implications that don't have a direct AWS/GCP equivalent.",
  },
  {
    section_type: "mental_models",
    title: "How to think about Azure AI Services and Foundry together",
    order_index: 1,
    content: "**1. Azure AI Services (purpose-built APIs) and Azure OpenAI via Foundry (general-purpose foundation models) are the same AI-service-vs-platform distinction taught throughout this catalog's cloud courses** — check for a purpose-built service before reaching for a general foundation model.\n\n**2. Azure OpenAI's deployment types are a real, testable cost/reliability tradeoff, not an implementation detail** — Standard is pay-as-you-go with variable latency under load, Provisioned Throughput reserves capacity for predictable latency at a higher fixed cost, and Global Standard routes across regions for better availability.\n\n**3. Microsoft Foundry is the unified successor to what used to be split across Azure AI Studio and Azure OpenAI Studio** — recent material or job postings may still reference the older names, and recognizing them as the same underlying product is a real, practical fluency point.\n\n**4. Content filtering on Azure OpenAI is on by default and enforced at the platform level**, not something you opt into — this is Microsoft's Responsible AI principles (Module 1) made concrete as an actual product feature, and understanding its default-on behavior matters for both the exam and real deployments.",
  },
  {
    section_type: "decision_framework",
    title: "Which Azure AI approach fits a given scenario?",
    order_index: 2,
    content: "IF the task is a well-defined pretrained capability (sentiment, entity extraction, OCR, speech-to-text) THEN use the matching Azure AI Service, not Azure OpenAI.\n\nIF the task needs a general-purpose foundation model for text/chat/generation THEN use Azure OpenAI via Microsoft Foundry.\n\nIF the workload has unpredictable, bursty traffic and cost sensitivity matters more than consistent latency THEN choose a Standard deployment.\n\nIF the workload needs predictable, low-variance latency at meaningful volume (a production customer-facing feature) THEN choose Provisioned Throughput, budgeting for its higher fixed cost.\n\nIF availability across regions matters more than deployment simplicity THEN consider Global Standard.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this module's build deliverable",
    order_index: 3,
    content: "1. In Microsoft Foundry, create an Azure OpenAI resource and choose a deployment type appropriate for a test workload (Standard is the reasonable default for learning purposes).\n\n2. Deploy a specific model version to that resource.\n\n3. Call the deployed model via the Azure OpenAI SDK or REST API with a simple prompt, and confirm a real response.\n\n4. Deliberately trigger the platform's default content filtering with an edge-case prompt, and observe the filtered response — confirm you understand it's on by default, not something you configured.\n\n5. Compare, in one paragraph, what the Standard deployment type's tradeoffs would mean for a real production feature versus Provisioned Throughput.",
  },
  {
    section_type: "failure_modes",
    title: "Where Azure OpenAI deployment decisions actually go wrong",
    order_index: 4,
    content: "Failure 1 — Choosing Standard deployment for a production feature with strict latency requirements, without understanding the tradeoff.\nWhat: a customer-facing feature experiences inconsistent response times under real load because Standard's pay-as-you-go model doesn't reserve capacity, and this gets misdiagnosed as an application bug rather than a deployment-type mismatch.\nDetect: check whether the deployment type was chosen deliberately against the workload's actual latency requirements, or defaulted to Standard without consideration.\nPrevent: apply this module's decision framework — production, latency-sensitive workloads need Provisioned Throughput, not Standard.\nExam-style trap: a scenario describing consistent-latency requirements, testing whether you pick Provisioned Throughput over the (cheaper-sounding) Standard default.\n\nFailure 2 — Being surprised that content filtering blocked a legitimate edge-case prompt, and not knowing it's a platform default.\nWhat: a legitimate use case (e.g., discussing sensitive-but-appropriate medical or security content) gets blocked by default content filtering, and the response is to assume the model itself is broken rather than recognizing this as expected, configurable platform behavior.\nDetect: check whether the block came from the model or the platform's content filter layer before concluding anything is broken.\nPrevent: know that content filtering is on by default and can be configured (within Microsoft's responsible-use policies) for legitimate use cases, per this module's mental models.\nExam-style trap: a scenario testing whether you know content filtering is a default platform behavior, not an opt-in feature.",
  },
  {
    section_type: "checklist",
    title: "Azure OpenAI / Foundry Build Deliverable Checklist",
    order_index: 5,
    content: "- [ ] An Azure OpenAI resource created in Microsoft Foundry with a deliberately chosen deployment type\n- [ ] A specific model version deployed and confirmed reachable\n- [ ] A real API call made and a genuine model response received\n- [ ] Default content filtering behavior observed directly, not just read about\n- [ ] Can articulate the Standard vs. Provisioned Throughput tradeoff for a specific production scenario\n- [ ] Comfortable recognizing \"Azure AI Foundry\" and \"Microsoft Foundry\" as the same current product",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Microsoft Learn's official Azure OpenAI Service documentation, \"Deployment types\" — the direct, authoritative reference for this module's core decision framework.\n- Microsoft Foundry's official quickstart documentation — direct reference for the deploy-and-call workflow in this module's build deliverable.\n\nReference\n- This course's Module 3 (Building & Evaluating Copilots) — direct follow-on that builds a real application on top of the Azure OpenAI deployment created here.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Deploy and call an Azure OpenAI model from Microsoft Foundry",
    problem_statement: "Create an Azure OpenAI resource in Microsoft Foundry, deploy a model with a deliberately chosen deployment type, and call it via a real API request. Confirm a genuine response, not a mocked one.",
    starter_context: "This matches this module's stated build deliverable exactly.",
    hints: [
      "Justify your deployment-type choice in one sentence before creating the resource — this is the exam-tested decision this module emphasizes.",
    ],
    solution_notes: "A strong submission shows the actual API call, a real response, and an explicit, reasoned deployment-type choice — not just the default accepted without consideration.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Compare deployment types for three production scenarios",
    problem_statement: "Given three short scenarios (write your own — one bursty/cost-sensitive workload, one latency-critical customer-facing feature, one needing multi-region availability), choose the right Azure OpenAI deployment type for each and justify it using this module's decision framework.",
    starter_context: null,
    hints: [
      "Resist choosing Standard for all three by default — the point of this exercise is that the right choice genuinely differs per scenario.",
    ],
    solution_notes: "A strong submission picks a different deployment type for at least two of the three scenarios and justifies each against the scenario's specific latency/cost/availability requirements.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "What's the practical difference between Standard and Provisioned Throughput deployments on Azure OpenAI?", what_is_tested: "Core understanding of Azure OpenAI's deployment-type tradeoff.", strong_answer_structure: "Standard is pay-as-you-go with variable latency under load; Provisioned Throughput reserves fixed capacity for predictable, consistent latency at a higher fixed cost.", weak_answer_example: "\"Provisioned is just the more expensive option\" — misses the actual reliability tradeoff it buys.", follow_up_question: "What kind of production feature would justify the extra cost of Provisioned Throughput?" },
  { category: "applied", order_index: 1, question: "A client's customer support chatbot on Azure OpenAI is having inconsistent response times during peak hours. What would you check first?", what_is_tested: "Applied diagnostic reasoning connecting deployment type to real production symptoms.", strong_answer_structure: "Check the current deployment type — if it's Standard, that variable latency under load is expected behavior, and the fix is likely moving to Provisioned Throughput rather than debugging application code.", weak_answer_example: "Assuming it's an application-level bug without first checking the deployment type.", follow_up_question: "How would you confirm the deployment type is actually the cause before recommending a change?" },
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

console.log("Azure AI Module 2 (Azure AI Services & Microsoft Foundry) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
