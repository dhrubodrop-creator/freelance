// One-off content seed: loads the 19-course AI curriculum into the live
// Supabase project (courses + modules), reusing existing Ropes pricing/track
// conventions. Run with: node scripts/seed-ai-courses.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[()&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PRICES = {
  "AI-01": 14999, "AI-02": 17999, "AI-03": 12999, "AI-04": 16999, "AI-05": 24999,
  "AI-06": 14999, "AI-07": 19999, "AI-08": 18999, "AI-09": 16999, "AI-10": 16999,
  "AI-11": 19999, "AI-12": 15999, "AI-13": 12999, "AI-14": 18999, "AI-15": 19999,
  "AI-16": 15999, "AI-17": 14999, "AI-18": 15999, "AI-19": 16999,
};

const COURSES = [
{
  code:"AI-01", category:"Agentic Systems", title:"Agentic AI",
  tagline:"How to design AI systems that plan, decide, and act across multi-step tasks instead of just answering prompts.",
  weeks:[
    {label:"Week 1 — Agentic Systems Foundations"},
    {label:"Week 2 — Agent Architecture & Reasoning Patterns"},
    {label:"Week 3 — Tools, Memory & Grounding"},
    {label:"Week 4 — Multi-Agent Systems & Production Readiness"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=K269GcnN-t4"},
    {u:"https://www.youtube.com/playlist?list=PLlSLJhV9FomIU8A1bkP4If5Xuea2oJcqE"},
    {u:"https://www.youtube.com/playlist?list=PLYIE4hvbWhsAkn8VzMWbMOxetpaGp-p4k"},
    {u:"https://www.youtube.com/playlist?list=PLv8Cp2NvcY8DeLpPBREcC9aU8ESfYeSeX"}
  ]
},
{
  code:"AI-02", category:"Agentic Systems", title:"Agentic AI Development with LangChain & LangGraph",
  tagline:"The production framework stack for building controllable, stateful multi-agent applications.",
  weeks:[
    {label:"Week 1 — LangChain Fundamentals & LCEL"},
    {label:"Week 2 — Tool Calling & Retrieval-Augmented Generation"},
    {label:"Week 3 — LangGraph Orchestration"},
    {label:"Week 4 — Multi-Agent Graphs & Evaluation"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=Hz21KVo0t4E"},
    {u:"https://www.youtube.com/watch?v=DtW_Lc9hYoU"},
    {u:"https://www.youtube.com/watch?v=AOQyRiwydyo"}
  ]
},
{
  code:"AI-03", category:"Dev Tooling", title:"Claude Code AI",
  tagline:"Working inside Claude Code as an AI-native development environment — from setup to autonomous multi-step builds.",
  weeks:[
    {label:"Week 1 — Setup & Core Workflow"},
    {label:"Week 2 — Autonomous Task Loops"},
    {label:"Week 3 — Skills & Reusable Workflows"},
    {label:"Week 4 — Shipping a Real Product"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=HR1lI4V0oKE"},
    {u:"https://www.youtube.com/watch?v=gh2_PhgZGsM"},
    {u:"https://www.youtube.com/watch?v=lDAdc0w2kAk"}
  ]
},
{
  code:"AI-04", category:"AI Engineering", title:"AI Stack",
  tagline:"A ground-up map of the modern AI engineering stack — models, orchestration, retrieval, and deployment — as one connected system.",
  weeks:[
    {label:"Week 1 — Model & Prompting Layer"},
    {label:"Week 2 — Orchestration & Data Layer"},
    {label:"Week 3 — Serving & Infrastructure"},
    {label:"Week 4 — Full-Stack Integration"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE"}
  ]
},
{
  code:"AI-05", category:"AI Engineering", title:"AI Engineering for Forward Deployed Engineer",
  tagline:"How FDEs take AI from a working demo to something that survives inside a real customer's messy enterprise environment.",
  weeks:[
    {label:"Week 1 — FDE Fundamentals & Client Environments"},
    {label:"Week 2 — Containerizing Agentic Systems"},
    {label:"Week 3 — Kubernetes & CI/CD for AI Systems"},
    {label:"Week 4 — LLMOps, Observability & Incident Response"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=tmt7742tP74"},
    {u:"https://www.youtube.com/watch?v=OXq6sNIqkFY"}
  ]
},
{
  code:"AI-06", category:"AI Engineering", title:"Generative AI (GenAI)",
  tagline:"Foundational to advanced generative AI — how these models work and how to build real applications on top of them.",
  weeks:[
    {label:"Week 1 — Foundations"},
    {label:"Week 2 — Prompting & Structured Outputs"},
    {label:"Week 3 — RAG & Grounding"},
    {label:"Week 4 — Fine-Tuning & Deployment"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE"}
  ]
},
{
  code:"AI-07", category:"No-Code Automation", title:"AI Agents with n8n (No-Code)",
  tagline:"Building and selling production AI agents visually — no Python required — using n8n as the orchestration layer.",
  weeks:[
    {label:"Week 1 — Agentic System Design Mindset"},
    {label:"Week 2 — Automation Backbone (n8n)"},
    {label:"Week 3 — Intelligence Layer (OpenAI Agents)"},
    {label:"Week 4 — Intelligent Automation (n8n + OpenAI)"},
    {label:"Week 5 — Knowledge, Enterprise Context & Multi-Agent Systems"},
    {label:"Week 6 — Reliability, Governance & Monetization"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=eQNkwr82KVo"},
    {u:"https://www.youtube.com/watch?v=Ey18PDiaAYI"},
    {u:"https://www.youtube.com/watch?v=GuaKeDS6UKU"}
  ]
},
{
  code:"AI-08", category:"AI Operations", title:"AI Agents for DevOps Engineers",
  tagline:"Applying agentic AI to the DevOps lifecycle — incident response, deployment automation, and infrastructure monitoring.",
  weeks:[
    {label:"Week 1 — DevOps Meets Agentic AI"},
    {label:"Week 2 — Building an Ops Agent"},
    {label:"Week 3 — AIOps Signal Integration"},
    {label:"Week 4 — Guardrails & Production Rollout"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=gG_AD3ba8mg"},
    {u:"https://www.youtube.com/watch?v=GThudNtXHRA"}
  ]
},
{
  code:"AI-09", category:"AI Operations", title:"MLOps (Machine Learning Operations)",
  tagline:"Turning trained models into reproducible, monitored, production-grade ML systems.",
  weeks:[
    {label:"Week 1 — MLOps Foundations"},
    {label:"Week 2 — Data & Model Pipelines"},
    {label:"Week 3 — Deployment & Containerization"},
    {label:"Week 4 — Monitoring & Production Operations"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=dPmH3G9NQtY"}
  ]
},
{
  code:"AI-10", category:"AI Operations", title:"AIOps",
  tagline:"Using AI to automate IT operations itself — anomaly detection, alert correlation, and self-healing infrastructure.",
  weeks:[
    {label:"Week 1 — AIOps Foundations"},
    {label:"Week 2 — Anomaly Detection & Correlation"},
    {label:"Week 3 — Integration with Observability Stacks"},
    {label:"Week 4 — Toward Self-Healing Systems"}
  ],
  resources:[
    {u:"https://www.youtube.com/playlist?list=PLEBv0Ny-VjalwPAjEK3suyNnv28YtvDd_"},
    {u:"https://www.youtube.com/watch?v=-JqW619Zljo"},
    {u:"https://www.youtube.com/watch?v=gG_AD3ba8mg"}
  ]
},
{
  code:"AI-11", category:"AI Operations", title:"LLMOps",
  tagline:"Operationalizing large language models specifically — prompt versioning, evaluation, cost, and deployment at scale.",
  weeks:[
    {label:"Week 1 — Prompt & Model Lifecycle Management"},
    {label:"Week 2 — Evaluation at Scale"},
    {label:"Week 3 — Deployment & Infrastructure"},
    {label:"Week 4 — Production Case Project"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=cqpzyD7ikZQ"}
  ]
},
{
  code:"AI-12", category:"AI Strategy", title:"AI Product Management",
  tagline:"Product management for AI-native products — PRDs, evals, and roadmapping when the core feature is a model, not a form.",
  weeks:[
    {label:"Week 1 — AI Product Fundamentals"},
    {label:"Week 2 — Writing AI PRDs"},
    {label:"Week 3 — Evals & Metrics"},
    {label:"Week 4 — Roadmap, Positioning & Interviews"}
  ],
  resources:[
    {u:"https://www.youtube.com/playlist?list=PL-q2MNxDekiSkjtdqrenGA9YfcCqrrDfU"},
    {u:"https://www.youtube.com/watch?v=KjYCEiBTHFo"}
  ]
},
{
  code:"AI-13", category:"Data & ML", title:"Data Science (AI & ML)",
  tagline:"Core data science and machine learning foundations — the layer every AI specialization above is built on.",
  weeks:[
    {label:"Week 1 — Data Foundations"},
    {label:"Week 2 — Core ML"},
    {label:"Week 3 — Evaluation & Iteration"},
    {label:"Week 4 — End-to-End Delivery"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE"}
  ]
},
{
  code:"AI-14", category:"Data & ML", title:"Data Science with Generative AI",
  tagline:"Where classic data science meets generative models — RAG, fine-tuning, and LLM-powered analytics.",
  weeks:[
    {label:"Week 1 — Generative Models in a DS Workflow"},
    {label:"Week 2 — RAG for Analytics"},
    {label:"Week 3 — Fine-Tuning Open Models"},
    {label:"Week 4 — Shipping the Product"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE"}
  ]
},
{
  code:"AI-15", category:"AI Security", title:"AI Security",
  tagline:"Defending LLM applications and agents against prompt injection, jailbreaks, and the OWASP Top 10 for LLMs.",
  weeks:[
    {label:"Week 1 — The LLM Threat Landscape"},
    {label:"Week 2 — Attacking Your Own Systems"},
    {label:"Week 3 — Defense-in-Depth"},
    {label:"Week 4 — Governance & Review Process"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=4lI1PRV4Yj4"},
    {u:"https://www.youtube.com/watch?v=LB9v4Nf25-o"},
    {u:"https://www.youtube.com/watch?v=fCpAr2OylDw"}
  ]
},
{
  code:"AI-16", category:"Cloud AI", title:"Azure AI",
  tagline:"Building and certifying on Microsoft's AI stack — Azure AI Services, Azure OpenAI, and AI-102/AI-900 certification prep.",
  weeks:[
    {label:"Week 1 — AI Fundamentals on Azure (AI-900 track)"},
    {label:"Week 2 — Azure AI Services & Studio"},
    {label:"Week 3 — Building & Evaluating Copilots"},
    {label:"Week 4 — AI-102 Certification Push"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=K269GcnN-t4"}
  ]
},
{
  code:"AI-17", category:"Cloud AI", title:"AWS AI",
  tagline:"Amazon's AI/ML stack in production — Bedrock, SageMaker — with a direct path to the AWS Certified AI Practitioner exam.",
  weeks:[
    {label:"Week 1 — AI/ML Fundamentals on AWS (AIF-C01 track)"},
    {label:"Week 2 — Bedrock & SageMaker"},
    {label:"Week 3 — Data & Security for AI on AWS"},
    {label:"Week 4 — Certification Push"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=4rF3xsCeJHQ"}
  ]
},
{
  code:"AI-18", category:"Cloud AI", title:"GCP AI",
  tagline:"Building and deploying on Google Cloud's AI stack — Vertex AI, Gemini, and production ML pipelines.",
  weeks:[
    {label:"Week 1 — Vertex AI Platform Overview"},
    {label:"Week 2 — Building with Gemini"},
    {label:"Week 3 — Production Pipelines"},
    {label:"Week 4 — RAG & Deployment"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE"}
  ]
},
{
  code:"AI-19", category:"AI Security", title:"AI LLM Testing",
  tagline:"Quality engineering for AI systems — testing non-deterministic LLM and RAG outputs the way QA tests deterministic code.",
  weeks:[
    {label:"Week 1 — Why AI Testing Is Different"},
    {label:"Week 2 — Evaluation Metrics & Golden Datasets"},
    {label:"Week 3 — Tooling: DeepEval & RAGAS"},
    {label:"Week 4 — End-to-End AI Testing Project"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=JojcJe5dJTI"}
  ]
}
];

async function main() {
  for (const c of COURSES) {
    const slug = slugify(c.title);
    const price = PRICES[c.code];

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .upsert(
        { slug, title: c.title, price, description: c.tagline, track: c.category },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (courseErr) {
      console.error(`FAILED course ${c.code} (${slug}):`, courseErr.message);
      continue;
    }

    // clear existing modules for idempotent re-runs
    await supabase.from("modules").delete().eq("course_id", course.id);

    const moduleRows = c.weeks.map((w, i) => ({
      course_id: course.id,
      title: w.label.replace(/^Week \d+ — /, ""),
      video_url: c.resources[i % c.resources.length].u,
      order_index: i,
    }));

    const { error: modErr } = await supabase.from("modules").insert(moduleRows);
    if (modErr) {
      console.error(`FAILED modules for ${c.code}:`, modErr.message);
      continue;
    }

    console.log(`OK  ${c.code}  ${slug}  ₹${price}  ${moduleRows.length} modules`);
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});
