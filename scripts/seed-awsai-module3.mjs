import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "eedba028-4ad6-4a2f-b39b-e38627b2b0a5"; // Data & Security for AI on AWS

const sections = [
  {
    section_type: "the_field",
    title: "What it means to build an AI system on AWS that passes a security review, not just a demo",
    order_index: 0,
    content: "This module covers AIF-C01's Security, Compliance, and Governance for AI Solutions domain, plus the data-services layer (Glue, Athena, OpenSearch, Lake Formation) that feeds real AI systems. The exam tests governance concepts directly; a real client engagement tests whether you actually applied them — the build deliverable (a data pipeline feeding an AI service with governance controls applied) is deliberately both at once.\n\nThe data services matter here specifically in an AI context: Glue for ETL feeding a training dataset, Athena for querying that data without standing up a database, OpenSearch for the vector/search layer behind a RAG system, and Lake Formation for the access-control layer governing who and what can touch the underlying data.",
  },
  {
    section_type: "mental_models",
    title: "How to think about AI governance and data services on AWS together",
    order_index: 1,
    content: "**1. Governance for AI on AWS is layered, not a single control** — IAM handles who can call what, Lake Formation handles fine-grained data access, and model-level responsible-AI features (e.g., Bedrock Guardrails) handle content-level controls; the exam and real reviews expect you to know which layer handles which concern.\n\n**2. Lake Formation exists because IAM alone can't express table- or column-level access control cleanly** — this is the exam's core distinction between \"can you reach the S3 bucket\" (IAM) and \"can you see this specific column\" (Lake Formation).\n\n**3. A data pipeline feeding an AI service inherits that service's responsible-AI obligations** — if the AI service output could be biased or non-compliant, the governance question starts at the data pipeline, not just at the model.\n\n**4. Glue and Athena are the low-effort default for AI data prep** — reach for a custom Spark cluster or dedicated database only when Glue/Athena's serverless model genuinely doesn't fit, mirroring Module 1's managed-service-first mental model.",
  },
  {
    section_type: "decision_framework",
    title: "Which AWS data/governance service fits a given need?",
    order_index: 2,
    content: "IF the task is preparing/transforming data for an AI pipeline without managing servers THEN use Glue.\n\nIF the task is ad-hoc querying of data already in S3 without standing up a database THEN use Athena.\n\nIF the task is powering a search/RAG layer that needs vector or full-text search THEN use OpenSearch.\n\nIF the task is controlling exactly who/what can access specific tables or columns feeding an AI pipeline THEN use Lake Formation, on top of (not instead of) IAM.\n\nIF the concern is about the AI output's content (bias, harmful content, PII leakage) rather than data access THEN it's a responsible-AI/model-governance concern (e.g., Bedrock Guardrails), not a data-access-control concern.",
  },
  {
    section_type: "workflow",
    title: "Building this module's governed data pipeline",
    order_index: 3,
    content: "1. Land raw data in S3 and define its structure with a Glue Data Catalog crawler.\n\n2. Set up Lake Formation permissions on the catalog, scoping access to only what the downstream AI service actually needs (least privilege).\n\n3. Run a Glue ETL job to prepare the data for the AI service's expected input format.\n\n4. Query the prepared data with Athena to confirm it's structured correctly before feeding it downstream.\n\n5. Feed the prepared data to an AI service (e.g., a Bedrock or SageMaker pipeline from Module 2).\n\n6. Document the governance controls applied at each layer — IAM, Lake Formation, and any model-level guardrails — as part of the deliverable, not as an afterthought.",
  },
  {
    section_type: "failure_modes",
    title: "Where AI data governance on AWS actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Relying on IAM alone for fine-grained data access control.\nWhat: a pipeline grants broad S3/Glue Catalog access via IAM, with no Lake Formation layer, so anyone with catalog access can see columns they shouldn't (e.g., PII feeding a model that shouldn't need it).\nDetect: check whether column- or row-level restrictions exist anywhere, or whether access control stops at the table/bucket level.\nPrevent: apply Lake Formation permissions explicitly, per this module's decision framework, whenever fine-grained access matters.\nExam-style trap: a scenario testing whether you reach for Lake Formation or try to solve column-level access with IAM policies alone.\n\nFailure 2 — Treating data governance and model-output governance as the same problem.\nWhat: a pipeline has strong Lake Formation controls but no responsible-AI controls on the model's output, so the AI service produces biased or non-compliant results despite well-governed input data.\nDetect: check whether governance controls exist at both the data layer and the model-output layer, not just one.\nPrevent: apply this module's layered mental model — data access control and model-output control are separate, both-required layers.\nExam-style trap: a scenario framed as a data question that's actually testing responsible-AI/model-governance knowledge.",
  },
  {
    section_type: "checklist",
    title: "Governed AI Data Pipeline Checklist",
    order_index: 5,
    content: "- [ ] Raw data cataloged via Glue Data Catalog\n- [ ] Lake Formation permissions applied with least-privilege scoping, not just broad IAM access\n- [ ] Glue ETL job prepares data into the AI service's expected format\n- [ ] Athena used to verify data structure before it's fed downstream\n- [ ] Data successfully feeds a real AI service (Bedrock or SageMaker)\n- [ ] Governance controls at every layer (IAM, Lake Formation, model-level) are documented, not just applied",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- AWS's AIF-C01 exam guide's Security, Compliance, and Governance for AI Solutions domain — the authoritative testable scope for this module's governance content.\n- AWS Lake Formation's official documentation on fine-grained access control — direct reference for this module's core governance mechanism.\n\nReference\n- This course's Module 4 (Certification Push) — direct follow-on that drills this domain alongside the rest of the exam scope.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Build a governed data pipeline feeding an AI service",
    problem_statement: "Land sample data in S3, catalog it with Glue, apply Lake Formation permissions scoped to least privilege, run a Glue ETL job to prepare it, verify with Athena, then feed it to a real AI service (Bedrock or SageMaker).",
    starter_context: "This matches this module's stated build deliverable exactly.",
    hints: [
      "Document the governance controls applied at each layer as you go — this is part of the deliverable, not just the pipeline itself.",
    ],
    solution_notes: "A strong submission has a working pipeline plus explicit documentation of least-privilege Lake Formation scoping — a pipeline with only broad IAM access hasn't met the governance bar this module requires.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Audit a pipeline for the two failure modes",
    problem_statement: "Take the pipeline you built (or a described scenario) and explicitly check it against this module's two failure modes: is access control happening only at the IAM/table level, or genuinely at the column/row level where needed? And are there any model-output governance controls, separate from data access controls?",
    starter_context: null,
    hints: [
      "Write down which layer (data access vs. model output) each existing control actually addresses — gaps become obvious once separated this way.",
    ],
    solution_notes: "A strong audit explicitly separates data-layer and model-output-layer governance and identifies any layer with no real control, not just a general \"looks secure\" assessment.",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "Why would you use Lake Formation on top of IAM, rather than just relying on IAM alone?", what_is_tested: "Core understanding of why Lake Formation exists.", strong_answer_structure: "Explain that IAM controls resource-level access (can you reach the bucket/catalog) while Lake Formation adds fine-grained table/column/row-level access control that IAM can't express cleanly.", weak_answer_example: "\"They do the same thing\" — misses the distinct layers.", follow_up_question: "Give an example of a real access-control need IAM alone can't satisfy." },
  { category: "applied", order_index: 1, question: "Walk me through how you'd prepare and govern data feeding a Bedrock-based feature for a client with sensitive customer data.", what_is_tested: "Applied ability to design a governed AI data pipeline end to end.", strong_answer_structure: "Describe cataloging with Glue, least-privilege Lake Formation scoping, ETL preparation, and verification before the data reaches Bedrock, plus any model-level guardrails needed.", weak_answer_example: "Describing only the ETL/data-prep steps with no mention of access governance.", follow_up_question: "What would change in your approach if the data included regulated PII?" },
  { category: "scenario", order_index: 2, question: "A reviewer flags that your AI pipeline's underlying data has strong access controls, but the model's output could still leak sensitive information. What's missing?", what_is_tested: "Recognition that data governance and model-output governance are separate, both-required layers.", strong_answer_structure: "Identify that model-level output controls (e.g., guardrails against PII leakage in generated content) are a separate concern from data access control, and both need to be addressed independently.", weak_answer_example: "Assuming strong data access control alone is sufficient.", follow_up_question: "What AWS-native mechanism would you reach for to add that model-output-level control?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "AI Threat Modeling").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("AWS AI Module 3 (Data & Security for AI on AWS) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
