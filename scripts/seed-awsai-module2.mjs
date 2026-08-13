import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "f82a58ed-981a-44e4-860d-4fc2b3575d7a"; // Bedrock & SageMaker

const sections = [
  {
    section_type: "the_field",
    title: "What actually deploying a model via Bedrock and a pipeline via SageMaker involves",
    order_index: 0,
    content: "This module moves from Module 1's conceptual service map to hands-on fluency with AWS's two flagship AI platforms: Bedrock for managed GenAI, SageMaker for custom ML. The build deliverable — deploy a model via Bedrock and a custom pipeline via SageMaker — is deliberately both, because the exam (and real client work) expects you to choose correctly between them, and choosing correctly requires having actually used both.\n\nBedrock's core workflow is: pick a foundation model from its provider-agnostic catalog, configure access, and call it via API — most of the complexity is in prompt/model selection and IAM permissions, not infrastructure. SageMaker's core workflow is the full ML lifecycle: data prep, training job, model registry, endpoint deployment — genuine infrastructure ownership in exchange for genuine control.",
  },
  {
    section_type: "mental_models",
    title: "How to think about Bedrock and SageMaker as a practitioner, not just an exam-taker",
    order_index: 1,
    content: "**1. Bedrock's model catalog is provider-agnostic by design** — the same API surface calls Anthropic, Meta, Amazon, and other providers' models, so switching models is a config change, not a rebuild. This is Bedrock's actual practical advantage over calling a single provider's API directly.\n\n**2. A SageMaker endpoint is a real, billed, always-on resource** — unlike a serverless Bedrock call, an idle SageMaker real-time endpoint keeps costing money, which is why SageMaker deployments need an explicit endpoint-lifecycle plan, not just a training-job plan.\n\n**3. SageMaker's value is in the parts of the ML lifecycle that are genuinely hard to do well** — experiment tracking, model registry, reproducible training jobs, managed endpoints — not in making training itself faster.\n\n**4. Choosing Bedrock over SageMaker (or vice versa) mid-project is a legitimate, common outcome** — many real systems use Bedrock for the GenAI-facing feature and SageMaker for a custom classifier feeding it, in the same architecture.",
  },
  {
    section_type: "decision_framework",
    title: "How to actually execute the Bedrock + SageMaker build deliverable",
    order_index: 2,
    content: "IF the task is calling a foundation model with prompt engineering and no custom training THEN use Bedrock — enable model access in the console, then call via the Bedrock Runtime API.\n\nIF the task needs a model trained on your own labeled data THEN use SageMaker — a training job with a built-in or custom algorithm, registered to the SageMaker Model Registry.\n\nIF the SageMaker model needs to serve real-time predictions THEN deploy a real-time endpoint, but budget for its always-on cost — or use SageMaker Serverless Inference / batch transform if traffic is sparse or non-real-time.\n\nIF you're unsure whether a task needs Bedrock or SageMaker THEN default to Module 1's decision framework: no training needed → Bedrock or a purpose-built AI service; custom training on your own data → SageMaker.",
  },
  {
    section_type: "workflow",
    title: "The actual steps for this module's build deliverable",
    order_index: 3,
    content: "1. In the Bedrock console, request model access for at least one foundation model, and confirm it's granted (this can take a few minutes).\n\n2. Call the model via the Bedrock Runtime API (boto3's `bedrock-runtime` client) with a simple prompt, and confirm a real response.\n\n3. Prepare a small labeled dataset for a custom SageMaker training job — even a toy dataset is enough to complete the real lifecycle.\n\n4. Run a SageMaker training job using a built-in algorithm (e.g., XGBoost) against that dataset.\n\n5. Register the trained model to the SageMaker Model Registry.\n\n6. Deploy the model to a real-time endpoint, and confirm a real prediction — then delete the endpoint immediately after to avoid ongoing cost.\n\n7. Write one paragraph comparing the two experiences: what Bedrock abstracted away, and what SageMaker required you to own directly.",
  },
  {
    section_type: "failure_modes",
    title: "How this module's build deliverable actually goes wrong",
    order_index: 4,
    content: "Failure 1 — Leaving a SageMaker real-time endpoint running after testing.\nWhat: the endpoint keeps accruing cost indefinitely because it wasn't explicitly deleted after the test prediction.\nDetect: check the SageMaker console's Endpoints list for anything still \"InService\" after you're done testing.\nPrevent: treat endpoint deletion as a required last step of this module's workflow, not optional cleanup.\nExam-style trap: a scenario testing whether you know real-time endpoints bill continuously, unlike serverless inference.\n\nFailure 2 — Requesting Bedrock model access and assuming it's instant.\nWhat: the Bedrock API call fails because model access approval is still pending, and this gets misdiagnosed as a code or permissions bug.\nDetect: check the Bedrock console's Model Access page for the actual approval status before debugging the API call itself.\nPrevent: request model access as the very first step, before writing any calling code.\nExam-style trap: none directly, but a common first-time-user stumbling block worth knowing cold before an interview.",
  },
  {
    section_type: "checklist",
    title: "Bedrock + SageMaker Build Deliverable Checklist",
    order_index: 5,
    content: "- [ ] Bedrock model access requested and confirmed granted\n- [ ] A real Bedrock Runtime API call made and a genuine model response received\n- [ ] A SageMaker training job run against real (even if small) labeled data\n- [ ] The trained model registered to the SageMaker Model Registry\n- [ ] A real-time endpoint deployed and a genuine prediction confirmed\n- [ ] The endpoint explicitly deleted afterward to avoid ongoing cost\n- [ ] Can articulate, in your own words, when you'd choose Bedrock vs. SageMaker for a new task",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- AWS's Bedrock Runtime API documentation — the authoritative reference for the `InvokeModel` call used in this module's build deliverable.\n- AWS's SageMaker Developer Guide's \"Train a Model with Amazon SageMaker\" section — direct reference for the training-job workflow.\n\nReference\n- This course's Module 3 (Data & Security for AI on AWS) — direct follow-on for governance controls on the pipeline built here.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Deploy a model via Bedrock",
    problem_statement: "Request Bedrock model access, and make a real Bedrock Runtime API call to a foundation model with a simple prompt. Confirm a genuine response, not a mocked one.",
    starter_context: "This is the first half of the course's stated build deliverable for this module.",
    hints: [
      "Model access approval isn't instant — request it first, before writing any calling code.",
    ],
    solution_notes: "A strong submission shows the actual API call and a real response, plus a one-line note on which model was used and why.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Train, register, and deploy a custom SageMaker pipeline",
    problem_statement: "Using a small labeled dataset, run a SageMaker training job with a built-in algorithm, register the resulting model, deploy it to a real-time endpoint, confirm a real prediction, then delete the endpoint.",
    starter_context: "This is the second half of the course's stated build deliverable for this module.",
    hints: [
      "Delete the endpoint as soon as you've confirmed a prediction — it bills continuously while running.",
    ],
    solution_notes: "A strong submission has evidence of every lifecycle stage (training, registry, endpoint, prediction) plus explicit confirmation the endpoint was deleted afterward.",
  },
];

const interviewQuestions = [
  { category: "applied", order_index: 0, question: "Walk me through what happens, cost-wise, if you deploy a SageMaker real-time endpoint and forget about it.", what_is_tested: "Practical awareness of SageMaker's always-on billing model.", strong_answer_structure: "Explain that a real-time endpoint is a continuously running, billed resource, unlike a serverless Bedrock call, and describe the habit of deleting endpoints immediately after testing.", weak_answer_example: "\"It's fine, AWS only bills for actual usage\" — incorrect for real-time endpoints specifically.", follow_up_question: "What alternative would you use if the workload doesn't need continuous real-time serving?" },
  { category: "fundamentals", order_index: 1, question: "Why is Bedrock described as a 'provider-agnostic' model catalog?", what_is_tested: "Understanding of Bedrock's actual architectural advantage.", strong_answer_structure: "Explain that the same Bedrock Runtime API surface can call multiple providers' foundation models, making a model swap a configuration change rather than a rebuild.", weak_answer_example: "\"Bedrock is just Amazon's version of GPT\" — misses the multi-provider catalog design.", follow_up_question: "What's the practical benefit of that design for a real production system?" },
  { category: "scenario", order_index: 2, question: "A client has a mostly idle custom classifier they need served occasionally, not continuously. What SageMaker deployment option would you suggest instead of a real-time endpoint?", what_is_tested: "Applied knowledge of SageMaker's deployment options beyond real-time endpoints.", strong_answer_structure: "Recommend SageMaker Serverless Inference or batch transform, depending on whether responses need to be synchronous, and explain the cost tradeoff versus an always-on real-time endpoint.", weak_answer_example: "Recommending a real-time endpoint regardless of traffic pattern.", follow_up_question: "What would make you choose batch transform over serverless inference?" },
  { category: "debugging", order_index: 3, question: "Your first Bedrock API call fails immediately after you request model access. What's your first diagnostic step?", what_is_tested: "Practical debugging instinct for the most common first-time Bedrock stumbling block.", strong_answer_structure: "Check the Bedrock console's Model Access page for the actual approval status before assuming it's a code or permissions bug — access approval isn't instant.", weak_answer_example: "Immediately assuming it's an IAM permissions issue and rewriting the policy.", follow_up_question: "What would you check next if model access was already confirmed granted?" },
];

const { error: delSecErr } = await supabase.from("module_playbook_sections").delete().eq("module_id", MODULE_ID);
const { error: delExErr } = await supabase.from("exercises").delete().eq("module_id", MODULE_ID);
const { error: delIqErr } = await supabase.from("interview_questions").delete().eq("module_id", MODULE_ID);
if (delSecErr || delExErr || delIqErr) { console.error({ delSecErr, delExErr, delIqErr }); process.exit(1); }

const { error: secErr } = await supabase.from("module_playbook_sections").insert(sections.map((s, i) => ({ ...s, module_id: MODULE_ID, order_index: s.order_index ?? i })));
const { error: exErr } = await supabase.from("exercises").insert(exercises.map((e, i) => ({ ...e, module_id: MODULE_ID, order_index: i })));
const { error: iqErr } = await supabase.from("interview_questions").insert(interviewQuestions.map((q) => ({ ...q, module_id: MODULE_ID })));
if (secErr || exErr || iqErr) { console.error({ secErr, exErr, iqErr }); process.exit(1); }

const { data: skill } = await supabase.from("skills").select("id").eq("name", "AWS Bedrock & SageMaker").single();
const { error: msErr } = await supabase.from("module_skills").delete().eq("module_id", MODULE_ID);
const { error: msErr2 } = await supabase.from("module_skills").insert({ module_id: MODULE_ID, skill_id: skill.id });
if (msErr || msErr2) { console.error({ msErr, msErr2 }); process.exit(1); }

console.log("AWS AI Module 2 (Bedrock & SageMaker) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
