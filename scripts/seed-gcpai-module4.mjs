import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "2844e4ce-1010-49a0-8db0-d4f2badaa7fa"; // RAG & Deployment

const sections = [
  {
    section_type: "the_field",
    title: "What shipping a real, deployed GCP-hosted RAG product actually takes",
    order_index: 0,
    content: "This capstone module brings the course's full arc — Module 1's model-path selection, Module 2's Gemini feature-building, Module 3's pipeline orchestration — to a complete, deployed product: a RAG-powered search app on your own data, with real deployment, scaling, and cost management. This is the same RAG-to-production discipline taught in this catalog's RAG Pipeline Design skill, applied specifically to GCP's native stack (Vertex AI Search or a self-built retrieval layer, paired with Gemini).\n\nGCP offers a genuine build-vs-managed choice here: Vertex AI Search (formerly Enterprise Search) is Google's managed retrieval layer, while a self-built pipeline (embeddings via Vertex AI, a vector store, custom retrieval logic) trades setup effort for full control — the same managed-vs-custom tradeoff established in Module 1, now applied to the retrieval layer specifically.",
  },
  {
    section_type: "mental_models",
    title: "How to think about a production RAG app on GCP",
    order_index: 1,
    content: "**1. Vertex AI Search vs. a self-built retrieval pipeline is the same managed-vs-custom tradeoff as Module 1's AutoML-vs-custom-training decision, applied to retrieval** — start with the managed option unless there's a specific, demonstrated reason it doesn't fit.\n\n**2. A RAG app's real cost has at least three separate levers: embedding generation, retrieval infrastructure, and generation (Gemini) calls** — cost management requires understanding which lever is actually driving spend, not treating \"AI cost\" as one undifferentiated number.\n\n**3. Deployment and scaling on GCP for a Gemini-backed app is largely about managing concurrent request volume against Vertex AI's quotas** — a working demo and a system that survives real concurrent traffic are genuinely different engineering problems.\n\n**4. \"Deployed\" means reachable and stable under realistic load, not just \"runs on my machine and once in a demo\"** — the same production-readiness bar established throughout this catalog's capstone modules.",
  },
  {
    section_type: "decision_framework",
    title: "How to design and ship this capstone's RAG app",
    order_index: 2,
    content: "IF the data is a moderate-to-large corpus needing standard retrieval (no unusual ranking/filtering logic) THEN start with Vertex AI Search — it's the lowest-effort path.\n\nIF the retrieval need has requirements Vertex AI Search doesn't cleanly support (custom ranking signals, unusual filtering, a non-standard data source) THEN build a custom pipeline with Vertex AI Embeddings and a vector store.\n\nIF cost is climbing unexpectedly THEN check each of the three cost levers (embedding, retrieval infra, generation) separately before assuming the fix is \"use a cheaper model\" — the actual driver might be embedding volume or retrieval infra, not generation.\n\nIF the app needs to handle real concurrent users THEN explicitly test against Vertex AI's quota limits before considering the deployment complete — don't assume single-user demo performance generalizes.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this capstone",
    order_index: 3,
    content: "1. Choose your own data corpus — something real enough that retrieval quality actually matters (not a toy dataset with one obvious answer per query).\n\n2. Decide, using this module's decision framework, between Vertex AI Search and a self-built retrieval pipeline.\n\n3. Build the retrieval layer and confirm it returns genuinely relevant results for a range of real test queries, not just the one query you designed around.\n\n4. Wire retrieval results into a Gemini prompt (from Module 2's discipline) to produce grounded, cited answers.\n\n5. Deploy the app (e.g., via Cloud Run) and test it under simulated concurrent load, not just single-request testing.\n\n6. Review your GCP billing/cost breakdown by service (embeddings, retrieval infra, Gemini calls) and identify which lever is the actual primary cost driver.\n\n7. Write a short deployment summary: what's deployed, what its cost profile looks like, and what would need to change to handle 10x the current traffic.",
  },
  {
    section_type: "failure_modes",
    title: "How this capstone's RAG app actually fails to ship",
    order_index: 4,
    content: "Failure 1 — Building a custom retrieval pipeline by default, without checking whether Vertex AI Search already covers the need.\nWhat: significant embedding/vector-store infrastructure work is built for a standard retrieval need that Vertex AI Search would have handled with far less effort.\nDetect: check whether the actual retrieval requirements include anything Vertex AI Search genuinely can't do, or whether custom was chosen out of habit.\nPrevent: apply this module's decision framework — start with the managed option and only go custom with a specific, demonstrated reason.\nInterview question: \"When would you choose a custom retrieval pipeline over Vertex AI Search?\"\n\nFailure 2 — Never testing the deployed app under concurrent load, only single-request demo conditions.\nWhat: the app works fine in a live demo but breaks or slows dramatically under real concurrent traffic, discovered only after real users hit it.\nDetect: check whether load testing against realistic concurrent request volume ever actually happened, or whether \"deployed\" only meant \"reachable.\"\nPrevent: explicitly load-test against Vertex AI's quota limits as a required step in this capstone's workflow, not an optional polish step.\nInterview question: \"How did you verify your RAG app could handle more than one user at a time?\"",
  },
  {
    section_type: "checklist",
    title: "RAG & Deployment Capstone Checklist",
    order_index: 5,
    content: "- [ ] Retrieval layer choice (Vertex AI Search vs. custom) was a deliberate decision, not a default habit\n- [ ] Retrieval quality verified against a range of real test queries, not just one designed-around query\n- [ ] Generated answers are grounded and cited from retrieved content, not just the model's parametric knowledge\n- [ ] App is deployed and reachable, not just running locally\n- [ ] App has been tested under simulated concurrent load, not just single-request conditions\n- [ ] Cost breakdown reviewed by service (embeddings, retrieval infra, generation) to identify the actual primary cost driver\n- [ ] A short deployment summary exists covering current cost profile and what a 10x traffic increase would require",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- Google Cloud's official Vertex AI Search documentation — direct reference for the managed retrieval path this module's decision framework defaults to.\n- Google Cloud's Cloud Run documentation on concurrency and scaling — direct reference for this capstone's load-testing and deployment requirements.\n\nReference\n- This catalog's RAG Pipeline Design skill content (in the Generative AI and AI Stack course tracks) — direct reference for the general RAG discipline applied here to GCP's native stack.",
  },
];

const exercises = [
  {
    level: "capstone",
    order_index: 0,
    title: "Capstone: a RAG-powered search app on your own data, deployed on GCP",
    problem_statement: "Build a RAG-powered search app on a real data corpus of your choosing. Choose deliberately between Vertex AI Search and a custom retrieval pipeline. Wire retrieval into Gemini for grounded, cited answers. Deploy the app, load-test it under simulated concurrent traffic, and review its cost breakdown by service.",
    starter_context: "This matches this course's stated capstone build deliverable exactly: a RAG-powered search app on your own data, deployed on GCP.",
    hints: [
      "Test retrieval quality against a range of real queries before wiring it into Gemini — a retrieval layer that only works for one designed-around query will produce ungrounded answers for everything else.",
    ],
    solution_notes: "A strong capstone submission has a genuinely deployed, load-tested app with a deliberate retrieval-architecture choice and a real cost breakdown identifying the actual primary cost driver — not just a working local prototype.",
  },
];

const interviewQuestions = [
  { category: "project_defence", order_index: 0, question: "Walk me through why you chose Vertex AI Search (or a custom pipeline) for your capstone's retrieval layer.", what_is_tested: "Whether the retrieval architecture decision was deliberate, per this module's decision framework.", strong_answer_structure: "Describe the actual retrieval requirements of the chosen data corpus and explain why the managed or custom option specifically fit those requirements, not just a general preference.", weak_answer_example: "\"I just went with what seemed easier\" — no real requirements-based reasoning.", follow_up_question: "What would have made you choose differently?" },
  { category: "applied", order_index: 1, question: "Your RAG app's GCP bill is higher than expected. How do you find out which service is actually driving the cost?", what_is_tested: "Applied understanding of the three separate cost levers this module identifies.", strong_answer_structure: "Break down the billing by service — embedding generation, retrieval infrastructure, and Gemini generation calls — rather than assuming a single undifferentiated \"AI cost.\"", weak_answer_example: "\"I'd just switch to a cheaper model\" — assumes generation is the driver without checking.", follow_up_question: "What would you do differently if embedding generation, not Gemini calls, turned out to be the primary cost driver?" },
  { category: "scenario", order_index: 2, question: "Your capstone app works perfectly in a live demo. A client asks if it can handle 50 concurrent users. What's your honest answer, and how would you find out?", what_is_tested: "Recognition that demo performance and concurrent-load performance are genuinely different questions.", strong_answer_structure: "Acknowledge that demo performance doesn't answer the concurrency question, and describe explicitly load-testing against Vertex AI's quota limits before giving a confident answer.", weak_answer_example: "Assuming the demo's smooth performance generalizes to 50 concurrent users without testing.", follow_up_question: "What would you change in the architecture if the load test revealed a bottleneck?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "RAG Pipeline Design").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("GCP AI Module 4 (RAG & Deployment) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
