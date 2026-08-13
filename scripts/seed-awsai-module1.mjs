import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")]; })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { realtime: { transport: ws } });

const MODULE_ID = "403c4d19-3772-44de-bf55-b09fef5127ea"; // AI/ML Fundamentals on AWS (AIF-C01 track)

const sections = [
  {
    section_type: "the_field",
    title: "What the AWS Certified AI Practitioner (AIF-C01) exam actually tests, and why it's worth having cold",
    order_index: 0,
    content: "AIF-C01 is AWS's entry-level AI/ML certification — it doesn't test hands-on model-building, it tests whether you can correctly reason about AI/ML/GenAI concepts and know AWS's AI service map well enough to make a sound service recommendation under exam conditions. That's also, not coincidentally, what a client or hiring manager needs from someone advising them on an AWS AI project before any code gets written.\n\nThe exam has five domains: Fundamentals of AI and ML, Fundamentals of Generative AI, Applications of Foundation Models, Guidelines for Responsible AI, and Security, Compliance, and Governance for AI Solutions. This module covers the first three; Module 3 covers the governance/security domain in depth.",
  },
  {
    section_type: "mental_models",
    title: "How to think about AWS's AI service map",
    order_index: 1,
    content: "**1. AWS's AI services form a spectrum from fully-managed (least control, least effort) to fully custom (most control, most effort)** — the exam consistently tests whether you can place a given use case correctly on this spectrum, not just name services.\n\n**2. Traditional ML (supervised/unsupervised learning on structured data) and generative AI (foundation models producing novel content) are tested as genuinely distinct domains** — a service that's right for one is often wrong for the other, and the exam will test this distinction directly.\n\n**3. \"Foundation model\" is AWS's vendor-neutral term for what most of the industry calls a large pretrained model** — the exam expects fluency with this term specifically, since it spans Bedrock's provider-agnostic model catalog.\n\n**4. Every AWS AI service question has an implicit \"why not just use SageMaker/Bedrock directly\" angle** — the exam tests whether you understand why a managed layer (e.g., Comprehend for text analysis) exists on top of the general-purpose platforms, not just that it exists.",
  },
  {
    section_type: "decision_framework",
    title: "Which category of AWS AI service fits a given exam scenario?",
    order_index: 2,
    content: "IF the scenario needs a pretrained, ready-to-call capability (translation, sentiment, transcription, OCR) with no model training THEN it's an AI service like Comprehend, Translate, Transcribe, or Textract — not SageMaker or Bedrock.\n\nIF the scenario needs a foundation model for text/image generation with minimal infrastructure management THEN it's Bedrock — the exam's default answer for \"generative AI, managed.\"\n\nIF the scenario needs custom model training on the org's own structured data with full control over the ML lifecycle THEN it's SageMaker — the exam's default answer for \"custom ML, full control.\"\n\nIF the scenario mentions responsible AI, bias, or explainability THEN the correct domain is Guidelines for Responsible AI, not a service-selection question — watch for this framing trap.",
  },
  {
    section_type: "workflow",
    title: "The real study process for this domain",
    order_index: 3,
    content: "1. Read AWS's own AIF-C01 exam guide top to bottom before any video content — it is the actual source of truth for what's testable.\n\n2. For each AWS AI service named in the guide, write one sentence: what it does, and what it's NOT for (the contrast is what the exam tests).\n\n3. Drill the AI-services-vs-SageMaker-vs-Bedrock decision framework above until the classification is instant, not deliberated.\n\n4. Take a first practice quiz focused only on Domains 1-3 before moving to Module 3's governance content.\n\n5. Review every missed question by identifying which mental model or decision-framework branch it violated, not just memorizing the correct answer.",
  },
  {
    section_type: "failure_modes",
    title: "Where AIF-C01 candidates actually lose points on Fundamentals",
    order_index: 4,
    content: "Failure 1 — Confusing an AI service (e.g., Comprehend) with the general-purpose platform underneath it (SageMaker/Bedrock).\nWhat: choosing SageMaker for a scenario that just needs sentiment analysis, because \"SageMaker does ML\" without checking whether a purpose-built service already exists.\nDetect: in review, ask \"could a ready-made AI service handle this without any training?\" before defaulting to SageMaker.\nPrevent: memorize the AI-services-vs-platform distinction from this module's decision framework as a first-pass filter.\nExam-style trap: a question describing a common NLP task in detail, testing whether you reach for Comprehend or overcomplicate with SageMaker.\n\nFailure 2 — Treating \"foundation model\" and \"large language model\" as fully interchangeable.\nWhat: missing that foundation models span modalities beyond text (image, multimodal), so a question about an image-generation scenario using \"foundation model\" language gets misread as text-only.\nDetect: check whether the scenario's foundation model use spans a modality you weren't expecting.\nPrevent: hold the broader, modality-agnostic definition of \"foundation model\" as this module's mental models establish.\nExam-style trap: a scenario testing multimodal foundation model use disguised as a routine GenAI question.",
  },
  {
    section_type: "checklist",
    title: "AIF-C01 Domains 1-3 Exam-Objective Checklist",
    order_index: 5,
    content: "- [ ] Can state, in one sentence each, what every major AWS AI service (Comprehend, Translate, Transcribe, Textract, Rekognition, Polly, Lex, Kendra, Personalize) does and doesn't do\n- [ ] Can correctly classify a scenario as AI-service vs. Bedrock vs. SageMaker using this module's decision framework, without hesitation\n- [ ] Can define \"foundation model\" in AWS's vendor-neutral sense, spanning text/image/multimodal\n- [ ] Can distinguish traditional supervised/unsupervised ML from generative AI as tested domains\n- [ ] Has taken at least one practice quiz on Domains 1-3 specifically and reviewed every miss against the mental models above",
  },
  {
    section_type: "resources",
    title: "Go deeper",
    order_index: 6,
    content: "Essential\n- AWS's official AIF-C01 exam guide — the definitive, authoritative source for what's testable; read it directly rather than relying on secondhand summaries.\n- AWS Skill Builder's free AIF-C01 learning plan — AWS's own structured prep path.\n\nReference\n- This course's Module 2 (Bedrock & SageMaker) — direct hands-on complement to the conceptual service-map knowledge built here.",
  },
];

const exercises = [
  {
    level: "guided",
    order_index: 0,
    title: "Classify ten AWS AI scenarios",
    problem_statement: "Take ten short AI/ML use-case scenarios (write your own, drawing from real business problems you know, or pull from AWS's exam guide sample questions) and classify each as: purpose-built AI service, Bedrock, or SageMaker — using this module's decision framework, not intuition.",
    starter_context: "Deliverable per this course's stated outcome: AIF-C01 practice review.",
    hints: [
      "For each scenario, first ask whether a ready-made AI service already solves it before considering Bedrock or SageMaker.",
    ],
    solution_notes: "A strong submission classifies all ten correctly and can explain, for each, which decision-framework branch drove the classification — not just the right label.",
  },
  {
    level: "semi_guided",
    order_index: 1,
    title: "Take and review a full Domains 1-3 practice quiz",
    problem_statement: "Take a practice quiz (AWS Skill Builder or a reputable third-party bank) covering AIF-C01 Domains 1-3 only. For every missed question, identify which mental model or decision-framework branch from this module was violated.",
    starter_context: null,
    hints: [
      "A miss you can't trace back to a specific mental model or framework branch usually means the underlying concept, not just the question, needs re-review.",
    ],
    solution_notes: "A strong review connects every miss to a specific gap in this module's content, not a vague \"I need to study more.\"",
  },
];

const interviewQuestions = [
  { category: "fundamentals", order_index: 0, question: "When would you reach for Amazon Comprehend instead of building a custom SageMaker model for text analysis?", what_is_tested: "The AI-service-vs-platform decision framework.", strong_answer_structure: "Explain that Comprehend already solves common NLP tasks (sentiment, entity extraction) without training, and SageMaker is only justified when the task is genuinely custom or the pretrained service doesn't fit.", weak_answer_example: "\"SageMaker is more powerful so I'd usually just use that\" — misses the managed-service-first reasoning.", follow_up_question: "What would make you conclude Comprehend genuinely doesn't fit and custom training is justified?" },
  { category: "fundamentals", order_index: 1, question: "What's the practical difference between Bedrock and SageMaker, in your own words?", what_is_tested: "Core conceptual fluency with AWS's two flagship AI platforms.", strong_answer_structure: "Bedrock is a managed layer for calling foundation models (generative AI) with minimal infrastructure; SageMaker is the full custom ML platform for training and deploying your own models on your own data.", weak_answer_example: "\"They're both AWS's AI products\" — no real distinction.", follow_up_question: "Could you use both together in a single project? Give an example." },
  { category: "applied", order_index: 2, question: "A client wants sentiment analysis on their support tickets. Walk me through your service recommendation.", what_is_tested: "Practical application of the decision framework to a realistic client scenario.", strong_answer_structure: "Start with Comprehend as the default managed-service answer, and only escalate to custom SageMaker training if Comprehend's built-in sentiment analysis genuinely doesn't fit their specific domain language.", weak_answer_example: "Jumping straight to a custom model without considering the managed option first.", follow_up_question: "What would tell you Comprehend's built-in sentiment model doesn't fit their domain?" },
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

console.log("AWS AI Module 1 (AI/ML Fundamentals AIF-C01 track) seeded:", sections.length, "sections,", exercises.length, "exercises,", interviewQuestions.length, "interview questions, 1 skill mapping.");
