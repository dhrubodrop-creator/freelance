// One-off content seed: loads the 19-course AI curriculum into the live
// Supabase project (courses + modules), with real Ropes-authored module
// content (topics/build/outcome) alongside each curated external video —
// not just a bare video link. Run with: node scripts/seed-ai-courses.mjs
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

function sourceLabel(url, resourceMeta) {
  if (resourceMeta?.s) return resourceMeta.s;
  if (url.includes("/playlist?list=")) return "YouTube playlist (curated, external)";
  return "YouTube (curated, external)";
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
    {label:"Week 1 — Agentic Systems Foundations", topics:["Automation vs. agentic AI","Chatbot vs. tool-using agent","Deterministic vs. reasoning systems","Single vs. multi-agent systems","Mapping real business scenarios"],
     build:"Map 3 agent use cases in a chosen business domain.", outcome:"Can tell a true agent from a scripted bot — and justify when one is actually warranted."},
    {label:"Week 2 — Agent Architecture & Reasoning Patterns", topics:["Agent components: goal, memory, tools, constraints","ReAct and plan-and-execute loops","Reflection and self-correction","Human-in-the-loop checkpoints"],
     build:"Design an Agent Architecture Blueprint (v1) for a real workflow.", outcome:"Can design an agent's control loop before writing a single line of code."},
    {label:"Week 3 — Tools, Memory & Grounding", topics:["Tool-calling and function schemas","Short-term vs. long-term memory","Connecting agents to real APIs and data","Reducing hallucination through grounding"],
     build:"Build a research + analysis agent wired to a real API.", outcome:"Ships an agent that reasons over real data — not a static prompt wearing a costume."},
    {label:"Week 4 — Multi-Agent Systems & Production Readiness", topics:["Supervisor / worker agent patterns","Escalation and failure handling","Cost and latency guardrails","Monitoring agent decisions in production"],
     build:"Capstone: a 2–3 agent team (research → draft → review) with logging and human override.", outcome:"Can ship a multi-agent system with the guardrails a paying client would actually require."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=K269GcnN-t4", s:"YouTube — I Tested 50 Agentic AI Courses (LogicMojo)"},
    {u:"https://www.youtube.com/playlist?list=PLlSLJhV9FomIU8A1bkP4If5Xuea2oJcqE", s:"YouTube playlist — Agentic AI Course"},
    {u:"https://www.youtube.com/playlist?list=PLYIE4hvbWhsAkn8VzMWbMOxetpaGp-p4k", s:"YouTube playlist — Agentic AI Complete Course, 14 Projects"},
    {u:"https://www.youtube.com/playlist?list=PLv8Cp2NvcY8DeLpPBREcC9aU8ESfYeSeX", s:"YouTube playlist — Learn Agentic AI: Basics to Advanced"}
  ]
},
{
  code:"AI-02", category:"Agentic Systems", title:"Agentic AI Development with LangChain & LangGraph",
  tagline:"The production framework stack for building controllable, stateful multi-agent applications.",
  weeks:[
    {label:"Week 1 — LangChain Fundamentals & LCEL", topics:["Models, messages, and prompt templates","Chains and Runnables","LangChain Expression Language (LCEL)","Output parsing"],
     build:"A basic chain-based Q&A application.", outcome:"Comfortable composing LLM logic declaratively instead of stringing together raw API calls."},
    {label:"Week 2 — Tool Calling & Retrieval-Augmented Generation", topics:["Function calling and the @tool decorator","Vector embeddings and chunking strategy","RAG pipeline: FAISS / Pinecone / Weaviate","Reranking and context compression"],
     build:"A RAG-backed support agent over your own documents.", outcome:"Can ground an LLM in real data reliably instead of hoping it remembers correctly."},
    {label:"Week 3 — LangGraph Orchestration", topics:["Graph-based state machines: nodes and edges","Short-term vs. long-term memory in graphs","Human-in-the-loop graph nodes","Conditional routing and cycles"],
     build:"Convert the Week 2 agent into a stateful LangGraph application.", outcome:"Controls multi-step agent behavior precisely instead of hoping the LLM 'does the right thing.'"},
    {label:"Week 4 — Multi-Agent Graphs & Evaluation", topics:["Supervisor / worker agent graphs","LangSmith tracing and evaluation","Debugging agent failure paths","Deployment basics for graph-based agents"],
     build:"Capstone: a multi-agent LangGraph system with full tracing.", outcome:"Ships a LangGraph app with visibility into every decision it makes — not a black box."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=Hz21KVo0t4E", s:"YouTube — Complete LangGraph Tutorial 2026"},
    {u:"https://www.youtube.com/watch?v=DtW_Lc9hYoU", s:"YouTube — LangGraph Full Course: Build Real AI Agents"},
    {u:"https://www.youtube.com/watch?v=AOQyRiwydyo", s:"YouTube — LangChain Tutorial for Beginners"}
  ]
},
{
  code:"AI-03", category:"Dev Tooling", title:"Claude Code AI",
  tagline:"Working inside Claude Code as an AI-native development environment — from setup to autonomous multi-step builds.",
  weeks:[
    {label:"Week 1 — Setup & Core Workflow", topics:["Installing and configuring Claude Code natively and in VS Code","Project context files and repo awareness","Prompting for real code tasks, not toy examples","Git-aware review workflows"],
     build:"Scaffold a small real project end to end.", outcome:"Comfortable using Claude Code as a daily driver, not a novelty."},
    {label:"Week 2 — Autonomous Task Loops", topics:["The goal-driven execution loop","Defining success criteria the model can check itself against","Iterative self-correction","Reviewing AI-generated diffs safely"],
     build:"Hand off a multi-file feature and let it iterate to spec.", outcome:"Delegates real engineering tasks with confidence — not just autocomplete-level help."},
    {label:"Week 3 — Skills & Reusable Workflows", topics:["Installing and building reusable Claude Skills","Standardizing team workflows","Connecting to remote environments and larger codebases"],
     build:"Package a repeatable Skill for a workflow you do often.", outcome:"Turns one-off prompting into a reusable asset the whole team benefits from."},
    {label:"Week 4 — Shipping a Real Product", topics:["Multi-file architecture planning","Testing and validation loops","Deployment handoff","Working inside a large existing codebase"],
     build:"Capstone: ship a working app from idea to deployed build in one guided session.", outcome:"Can take a product idea to a deployed build using Claude Code as the primary tool."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=HR1lI4V0oKE", s:"YouTube — Learn Claude Code From Scratch in 3 Hours"},
    {u:"https://www.youtube.com/watch?v=gh2_PhgZGsM", s:"YouTube — Claude Code for Beginners [Full Course]"},
    {u:"https://www.youtube.com/watch?v=lDAdc0w2kAk", s:"YouTube — Claude Code Full Course: Beginner to Expert"}
  ]
},
{
  code:"AI-04", category:"AI Engineering", title:"AI Stack",
  tagline:"A ground-up map of the modern AI engineering stack — models, orchestration, retrieval, and deployment — as one connected system.",
  weeks:[
    {label:"Week 1 — Model & Prompting Layer", topics:["The LLM API landscape across providers","Prompting patterns and structured outputs","Cost and latency tradeoffs","Provider-agnostic design"],
     build:"A provider-agnostic prompting layer.", outcome:"Picks the right model for the job instead of defaulting to the familiar one."},
    {label:"Week 2 — Orchestration & Data Layer", topics:["Agent frameworks: LangChain/LangGraph-style orchestration","Embeddings and vector databases","RAG pipeline design"],
     build:"A RAG-backed feature wired to a real dataset.", outcome:"Understands exactly how the orchestration and data layers talk to each other."},
    {label:"Week 3 — Serving & Infrastructure", topics:["Containerizing AI services","API layers (FastAPI-style)","Scaling patterns","Observability basics"],
     build:"Containerize and serve the Week 2 pipeline behind an API.", outcome:"Moves a notebook prototype into something that survives real traffic."},
    {label:"Week 4 — Full-Stack Integration", topics:["Connecting all layers into one product","Cost monitoring","Security basics","Deployment checklist"],
     build:"Capstone: one full-stack AI feature, model to deployed endpoint.", outcome:"Owns the entire stack end to end, not just one layer of it."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE", s:"YouTube — Generative AI Bootcamp, Complete 65-Hour Course"}
  ]
},
{
  code:"AI-05", category:"AI Engineering", title:"AI Engineering for Forward Deployed Engineer",
  tagline:"How FDEs take AI from a working demo to something that survives inside a real customer's messy enterprise environment.",
  weeks:[
    {label:"Week 1 — FDE Fundamentals & Client Environments", topics:["The FDE role, mindset, and lifecycle","Notebook-to-client-environment transition","Client discovery and integration mapping","Configuration management across client-specific setups","Translating engineering trade-offs for business stakeholders"],
     build:"An environment audit and integration map for a mock client.", outcome:"Thinks like an engineer who has to make AI work inside someone else's mess — not a clean demo."},
    {label:"Week 2 — Containerizing Agentic Systems", topics:["Dockerizing LangChain / FastAPI / MCP applications","Multi-stage production Dockerfiles","Docker Compose for multi-service AI stacks","Image optimization and container security"],
     build:"Containerize a full agent stack — app, vector DB, and cache together.", outcome:"Can package an AI system the way it actually ships to a client, not a laptop-only demo."},
    {label:"Week 3 — Kubernetes & CI/CD for AI Systems", topics:["Deploying AI microservices on Kubernetes","GPU workload scheduling and autoscaling (HPA)","GitHub Actions pipelines and container registries","Blue-green / canary deployments and rollback strategy"],
     build:"Deploy the containerized stack to Kubernetes behind a CI/CD pipeline.", outcome:"Can take an agent from a single container to a live, scalable cluster deployment."},
    {label:"Week 4 — LLMOps, Observability & Incident Response", topics:["Monitoring with Prometheus and Grafana","OpenTelemetry and distributed tracing","Token usage and cost analytics","Production troubleshooting and root-cause analysis"],
     build:"Capstone: a full observability stack plus a structured incident postmortem on a simulated production failure.", outcome:"Can diagnose and fix a live AI incident under real pressure — the core FDE skill."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=tmt7742tP74", s:"YouTube — Forward Deployed Engineer Full Course 2026"},
    {u:"https://www.youtube.com/watch?v=OXq6sNIqkFY", s:"YouTube — Forward Deployed AI Engineer Explained"}
  ]
},
{
  code:"AI-06", category:"AI Engineering", title:"Generative AI (GenAI)",
  tagline:"Foundational to advanced generative AI — how these models work and how to build real applications on top of them.",
  weeks:[
    {label:"Week 1 — Foundations", topics:["Generative vs. discriminative models","Transformer architecture","Tokenization and embeddings"],
     build:"Implement a basic embedding-based similarity search.", outcome:"Understands what's actually happening inside the model, not just the API surface."},
    {label:"Week 2 — Prompting & Structured Outputs", topics:["Prompt engineering patterns","Few-shot design","Structured / JSON outputs","Output parsing and validation"],
     build:"A reliable structured-output pipeline for a real task.", outcome:"Gets consistent, parseable output instead of fighting the model every single call."},
    {label:"Week 3 — RAG & Grounding", topics:["RAG architecture","Chunking and retrieval strategy","Reranking","Hallucination reduction"],
     build:"A grounded Q&A system over a real document set.", outcome:"Ships a GenAI feature that doesn't make things up."},
    {label:"Week 4 — Fine-Tuning & Deployment", topics:["Fine-tuning approaches (LoRA / QLoRA)","Evaluating before vs. after tuning","Deployment and safety monitoring"],
     build:"Capstone: fine-tune a small model for a narrow task and deploy it behind an API.", outcome:"Knows when to fine-tune vs. when prompting or RAG is enough — and can execute either."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE", s:"YouTube — Generative AI Bootcamp, Complete 65-Hour Course"}
  ]
},
{
  code:"AI-07", category:"No-Code Automation", title:"AI Agents with n8n (No-Code)",
  tagline:"Building and selling production AI agents visually — no Python required — using n8n as the orchestration layer.",
  weeks:[
    {label:"Week 1 — Agentic System Design Mindset", topics:["Automation vs. agentic AI","Chatbot vs. tool-using agent","Deterministic vs. reasoning systems","Agent components: goal, memory, tools, constraints","Human-in-the-loop design"],
     build:"An Agent Design Document mapping 3 real use cases in your domain.", outcome:"Can scope an agent project before opening a single tool."},
    {label:"Week 2 — Automation Backbone (n8n)", topics:["n8n interface mastery","Triggers & webhooks","Conditional routing and data mapping","API calls via the HTTP node","Error handling, fallback, and human approval checkpoints"],
     build:"A production-style weekly reporting automation.", outcome:"Fluent in n8n as an orchestration engine, not just a demo toy."},
    {label:"Week 3 — Intelligence Layer (OpenAI Agents)", topics:["Agent instructions vs. prompts","Structured output design (JSON mindset)","Memory and context layering","Reviewer / approval loop pattern"],
     build:"A Research → Analyze → Summarize agent.", outcome:"Can design reasoning agents that hand off cleanly to each other."},
    {label:"Week 4 — Intelligent Automation (n8n + OpenAI)", topics:["Calling OpenAI from n8n","Passing and parsing structured prompts","Trigger → Agent → Action pattern","Escalation logic and logging AI decisions"],
     build:"A Lead Intake → AI Qualification → Routing system.", outcome:"Ships a real autonomous workflow, not just a chatbot."},
    {label:"Week 5 — Knowledge, Enterprise Context & Multi-Agent Systems", topics:["Context engineering and hallucination reduction","Microsoft Copilot Studio basics and Teams deployment","Manager / worker agent patterns","Orchestration and escalation models"],
     build:"An SOP AI assistant, plus a Research → Draft → Review → Approve → Send multi-agent system.", outcome:"Can design AI teams, not just single agents."},
    {label:"Week 6 — Reliability, Governance & Monetization", topics:["Prompt version control and guardrails","Logging, access controls, responsible AI principles","Packaging AI agent services and pricing strategy","Client proposal frameworks"],
     build:"Capstone: present 2–3 single agents, one intelligent automation workflow, one enterprise Copilot agent, and one multi-agent architecture — fully documented.", outcome:"Walks away with a sellable, client-ready AI agency portfolio."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=eQNkwr82KVo", s:"YouTube — n8n AI Agents & Automation Complete Course"},
    {u:"https://www.youtube.com/watch?v=Ey18PDiaAYI", s:"YouTube — Build & Sell n8n AI Agents, 8+ Hours, No Code"},
    {u:"https://www.youtube.com/watch?v=GuaKeDS6UKU", s:"YouTube — n8n Quick Start: Build Your First AI Agent"}
  ]
},
{
  code:"AI-08", category:"AI Operations", title:"AI Agents for DevOps Engineers",
  tagline:"Applying agentic AI to the DevOps lifecycle — incident response, deployment automation, and infrastructure monitoring.",
  weeks:[
    {label:"Week 1 — DevOps Meets Agentic AI", topics:["Where agents fit in CI/CD, monitoring, incident triage","Automation vs. agentic decision-making in ops"],
     build:"Map 3 DevOps processes suited for agent automation.", outcome:"Knows where an agent adds real leverage in a pipeline — and where it's overkill."},
    {label:"Week 2 — Building an Ops Agent", topics:["Agent reads logs/alerts and proposes or takes action","Tool-calling into real infrastructure APIs","Structured decision logging"],
     build:"An agent that triages a stream of mock alerts and proposes fixes.", outcome:"Has a working agent that reasons over real operational signal."},
    {label:"Week 3 — AIOps Signal Integration", topics:["Anomaly detection and alert correlation","Reducing alert noise","Wiring agent decisions into Prometheus/Grafana-style stacks"],
     build:"Connect the ops agent to a live-style monitoring feed.", outcome:"Agent decisions are grounded in real signal, not guesswork."},
    {label:"Week 4 — Guardrails & Production Rollout", topics:["Approval gates for infrastructure-touching actions","Rollback safety nets","Canary rollout of agent-assisted changes","Incident postmortems"],
     build:"Capstone: an agent-assisted deploy-and-rollback workflow with human approval gates.", outcome:"Can put an agent near production infrastructure without it becoming the incident."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=gG_AD3ba8mg", s:"YouTube — MLOps · AIOps · LLMOps · AI Agents Full Course"},
    {u:"https://www.youtube.com/watch?v=GThudNtXHRA", s:"YouTube — AI Agents Full Course: MLOps/LLMOps/AIOps/AgentOps"}
  ]
},
{
  code:"AI-09", category:"AI Operations", title:"MLOps (Machine Learning Operations)",
  tagline:"Turning trained models into reproducible, monitored, production-grade ML systems.",
  weeks:[
    {label:"Week 1 — MLOps Foundations", topics:["DevOps discipline applied to ML","The ML lifecycle end to end","Why experiment tracking matters"],
     build:"Set up a tracked experiment with ZenML/MLflow.", outcome:"Stops losing track of which model version did what."},
    {label:"Week 2 — Data & Model Pipelines", topics:["Data cleaning and feature engineering at scale","Pipeline design","Model evaluation practices"],
     build:"A full data-to-model pipeline on a real dataset.", outcome:"Has a reproducible pipeline instead of a one-off notebook."},
    {label:"Week 3 — Deployment & Containerization", topics:["Packaging models for deployment","Docker for ML services","Serving via an API layer"],
     build:"Containerize and serve the Week 2 model behind an endpoint.", outcome:"The model is actually usable by something other than a notebook."},
    {label:"Week 4 — Monitoring & Production Operations", topics:["Drift detection","Performance monitoring","Retraining triggers","Production dashboards"],
     build:"Capstone: a monitored, redeployable ML pipeline for a real prediction task.", outcome:"Ships a model that stays reliable after day one."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=dPmH3G9NQtY", s:"YouTube — Build ML Production Grade Projects, MLOps Course"}
  ]
},
{
  code:"AI-10", category:"AI Operations", title:"AIOps",
  tagline:"Using AI to automate IT operations itself — anomaly detection, alert correlation, and self-healing infrastructure.",
  weeks:[
    {label:"Week 1 — AIOps Foundations", topics:["Where AIOps sits between monitoring and full automation","Key signal types: logs, metrics, traces"],
     build:"Audit an existing (or mock) observability setup for AIOps readiness.", outcome:"Understands what AIOps actually replaces vs. what it augments."},
    {label:"Week 2 — Anomaly Detection & Correlation", topics:["ML-driven anomaly detection","Alert correlation across services","Reducing noise-to-signal ratio"],
     build:"A correlation rule set that collapses a flood of alerts into real incidents.", outcome:"Cuts alert noise instead of drowning the on-call engineer in it."},
    {label:"Week 3 — Integration with Observability Stacks", topics:["Wiring AIOps tooling into Prometheus/Grafana-style stacks","Dashboards built for ops teams, not data scientists"],
     build:"Integrate anomaly detection into a live-style dashboard.", outcome:"AIOps output becomes something an ops team will actually trust and act on."},
    {label:"Week 4 — Toward Self-Healing Systems", topics:["Auto-remediation patterns","Safe automated rollback","Human approval boundaries"],
     build:"Capstone: a self-healing workflow for one real failure scenario.", outcome:"Can design automation that fixes things without making them worse."}
  ],
  resources:[
    {u:"https://www.youtube.com/playlist?list=PLEBv0Ny-VjalwPAjEK3suyNnv28YtvDd_", s:"YouTube playlist — AIOPS, LLMOPS & GenAI Full Course"},
    {u:"https://www.youtube.com/watch?v=-JqW619Zljo", s:"YouTube — How to Learn and Get Started with MLOps & AIOps"}
  ]
},
{
  code:"AI-11", category:"AI Operations", title:"LLMOps",
  tagline:"Operationalizing large language models specifically — prompt versioning, evaluation, cost, and deployment at scale.",
  weeks:[
    {label:"Week 1 — Prompt & Model Lifecycle Management", topics:["Prompt registries and versioning","Managing multiple model providers","Environment promotion for prompts (dev → staging → prod)"],
     build:"Version-control a real prompt library across environments.", outcome:"Prompts stop breaking silently when someone 'just edits' one."},
    {label:"Week 2 — Evaluation at Scale", topics:["LLM-as-judge techniques","Building golden datasets","Automated regression testing for prompts and models"],
     build:"An automated eval suite for a real LLM feature.", outcome:"Catches quality regressions before users do."},
    {label:"Week 3 — Deployment & Infrastructure", topics:["Docker / Kubernetes for LLM services","CI/CD for prompt and model changes","Cost and latency monitoring"],
     build:"Deploy an LLM service with a CI/CD gate tied to eval results.", outcome:"Ships model and prompt changes without breaking production silently."},
    {label:"Week 4 — Production Case Project", topics:["Full LLMOps stack applied to one real agentic application","Incident response for model regressions"],
     build:"Capstone: an agentic AI project (e.g. a trip planner) shipped with full LLMOps practices.", outcome:"Owns the entire operational lifecycle of an LLM feature, not just the demo."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=cqpzyD7ikZQ", s:"YouTube — LLMOps AIOps Course with 9+ Industry Grade Projects"}
  ]
},
{
  code:"AI-12", category:"AI Strategy", title:"AI Product Management",
  tagline:"Product management for AI-native products — PRDs, evals, and roadmapping when the core feature is a model, not a form.",
  weeks:[
    {label:"Week 1 — AI Product Fundamentals", topics:["How AI PM differs from traditional PM","Probabilistic vs. deterministic features","Framing AI bets honestly"],
     build:"Write a one-page AI feature brief for a real product idea.", outcome:"Can pitch an AI feature without overselling what the model can actually do."},
    {label:"Week 2 — Writing AI PRDs", topics:["PRDs for LLM / RAG / agent features","Defining success criteria for non-deterministic systems","Scoping MVP evals"],
     build:"A full PRD for an LLM-powered feature.", outcome:"Engineering can build from the spec without guessing intent."},
    {label:"Week 3 — Evals & Metrics", topics:["Understanding evals well enough to challenge engineering's numbers","Analytics for probabilistic features","Cost-per-outcome thinking"],
     build:"Define the eval and success metrics for the Week 2 PRD.", outcome:"Can tell the difference between 'the demo looked good' and 'this is actually working.'"},
    {label:"Week 4 — Roadmap, Positioning & Interviews", topics:["Roadmapping AI features against model and infra constraints","Stakeholder communication","AI PM interview prep"],
     build:"Capstone: a 2-quarter AI product roadmap with tradeoffs justified.", outcome:"Ready to operate as — or hire and manage — an AI PM in a real organization."}
  ],
  resources:[
    {u:"https://www.youtube.com/playlist?list=PL-q2MNxDekiSkjtdqrenGA9YfcCqrrDfU", s:"YouTube playlist — AI Product Management Course"},
    {u:"https://www.youtube.com/watch?v=KjYCEiBTHFo", s:"YouTube — AI Product Management, Complete 3.5-hr Masterclass"}
  ]
},
{
  code:"AI-13", category:"Data & ML", title:"Data Science (AI & ML)",
  tagline:"Core data science and machine learning foundations — the layer every AI specialization above is built on.",
  weeks:[
    {label:"Week 1 — Data Foundations", topics:["Exploratory data analysis","Building a defensible data narrative","Data cleaning practices"],
     build:"A full EDA report on a real dataset.", outcome:"Can read a dataset and know what's actually in it before modeling anything."},
    {label:"Week 2 — Core ML", topics:["Supervised / unsupervised / reinforcement learning fundamentals","Feature engineering","Model selection"],
     build:"Train and compare 2–3 models on the same problem.", outcome:"Picks a model based on evidence, not habit."},
    {label:"Week 3 — Evaluation & Iteration", topics:["Evaluation metrics that match the business problem","Error analysis","Iteration cycles"],
     build:"A documented model evaluation and improvement cycle.", outcome:"Knows when a model is 'good enough' to ship and why."},
    {label:"Week 4 — End-to-End Delivery", topics:["From raw data to a deployed prediction model","Interview-style project walkthroughs"],
     build:"Capstone: a full pipeline from raw data to a deployed model, presented like a real interview case.", outcome:"Has a portfolio project that survives real technical scrutiny."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE", s:"YouTube — Generative AI Bootcamp, Complete 65-Hour Course"}
  ]
},
{
  code:"AI-14", category:"Data & ML", title:"Data Science with Generative AI",
  tagline:"Where classic data science meets generative models — RAG, fine-tuning, and LLM-powered analytics.",
  weeks:[
    {label:"Week 1 — Generative Models in a DS Workflow", topics:["Positioning LLMs alongside classic ML","When generative beats predictive (and vice versa)"],
     build:"Identify where GenAI actually improves an existing DS workflow.", outcome:"Stops reaching for an LLM when a regression would do the job better and cheaper."},
    {label:"Week 2 — RAG for Analytics", topics:["Building and evaluating RAG systems on real datasets","Grounding analytics in retrieved facts, not model memory"],
     build:"A RAG-powered analytics assistant over a real dataset.", outcome:"Can answer natural-language questions over data without hallucinated numbers."},
    {label:"Week 3 — Fine-Tuning Open Models", topics:["QLoRA / SFT fine-tuning for specialized tasks","Evaluating tuned vs. base model performance"],
     build:"Fine-tune a small open model on a narrow, real task.", outcome:"Can decide — and execute — whether fine-tuning is worth the cost for a given problem."},
    {label:"Week 4 — Shipping the Product", topics:["LLM-as-judge and RAGAS-style evaluation","Packaging a generative-AI analytics feature for real users"],
     build:"Capstone: a generative-AI-powered analytics or agent product, evaluated and deployed.", outcome:"Ships a GenAI-powered data product end to end, not just a notebook demo."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE", s:"YouTube — Generative AI Bootcamp, Complete 65-Hour Course"}
  ]
},
{
  code:"AI-15", category:"AI Security", title:"AI Security",
  tagline:"Defending LLM applications and agents against prompt injection, jailbreaks, and the OWASP Top 10 for LLMs.",
  weeks:[
    {label:"Week 1 — The LLM Threat Landscape", topics:["OWASP Top 10 for LLMs","Why prompt injection is the #1 risk","Threat modeling for AI applications"],
     build:"A threat model for a real (or sample) AI application.", outcome:"Knows what to actually worry about versus security theater."},
    {label:"Week 2 — Attacking Your Own Systems", topics:["Direct vs. indirect prompt injection","RAG poisoning","Agent hijacking","Hands-on red-teaming"],
     build:"Run a structured red-team pass against a sample LLM app.", outcome:"Has actually broken an AI system, not just read about how it's done."},
    {label:"Week 3 — Defense-in-Depth", topics:["Input validation and output filtering","Guardrails","Sandboxing agent tool access"],
     build:"Patch the vulnerabilities found in Week 2 with layered defenses.", outcome:"Can defend a system, not just diagnose it."},
    {label:"Week 4 — Governance & Review Process", topics:["Enterprise AI security review checklists","Responsible disclosure","Ongoing monitoring for new attack patterns"],
     build:"Capstone: a full AI security review checklist and report for a real application.", outcome:"Can run a credible AI security review a client or employer will actually trust."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=4lI1PRV4Yj4", s:"YouTube — AI Security Masterclass: Prompt Injection & LLM Security"},
    {u:"https://www.youtube.com/watch?v=LB9v4Nf25-o", s:"YouTube — LLM01: Prompt Injection Explained, OWASP Top 10"},
    {u:"https://www.youtube.com/watch?v=fCpAr2OylDw", s:"YouTube — How AI Prompt Injection Works, Hands-on with LLMs"}
  ]
},
{
  code:"AI-16", category:"Cloud AI", title:"Azure AI",
  tagline:"Building and certifying on Microsoft's AI stack — Microsoft Foundry, Azure OpenAI, and AI-900/AI-103 certification prep.",
  weeks:[
    {label:"Week 1 — AI Fundamentals on Azure (AI-900 track)", topics:["AI vs. GenAI","Foundational models and transformers","Responsible AI principles at Microsoft"],
     build:"AI-900 practice review.", outcome:"Passes AI-900-level conceptual questions cold."},
    {label:"Week 2 — Azure AI Services & Microsoft Foundry", topics:["Azure AI Services","Microsoft Foundry (formerly Azure AI Foundry)","Azure OpenAI Service basics and deployment types"],
     build:"Deploy and call an Azure OpenAI model from Microsoft Foundry.", outcome:"Comfortable navigating the actual Microsoft Foundry console, not just the theory."},
    {label:"Week 3 — Building & Evaluating Copilots", topics:["Prompt Flow","GenAIOps","Evaluation and monitoring for copilots"],
     build:"A working copilot with Prompt Flow evaluation attached.", outcome:"Can build and evaluate a real Azure-hosted copilot."},
    {label:"Week 4 — AI-103 Certification Push", topics:["Exam guide breakdown for AI-103 (Azure AI Apps and Agents Developer Associate)","Hands-on labs mapped to exam objectives","Mock exam review"],
     build:"Capstone: a full AI-103 mock exam plus gap review.", outcome:"Exam-ready for the current Azure AI Apps and Agents Developer Associate certification. (AI-102, the prior credential, was retired June 30, 2026.)"}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=K269GcnN-t4", s:"YouTube / freeCodeCamp — Azure AI Engineer Associate (AI-102) Full Course"}
  ]
},
{
  code:"AI-17", category:"Cloud AI", title:"AWS AI",
  tagline:"Amazon's AI/ML stack in production — Bedrock, SageMaker — with a direct path to the AWS Certified AI Practitioner exam.",
  weeks:[
    {label:"Week 1 — AI/ML Fundamentals on AWS (AIF-C01 track)", topics:["AI/ML/GenAI concepts as tested on the exam","AWS's AI service map"],
     build:"AIF-C01 practice review.", outcome:"Passes AI Practitioner-level conceptual questions cold."},
    {label:"Week 2 — Bedrock & SageMaker", topics:["AWS Bedrock for GenAI","SageMaker for custom ML","Managed ML services overview"],
     build:"Deploy a model via Bedrock and a custom pipeline via SageMaker.", outcome:"Comfortable choosing between managed GenAI and custom ML on AWS."},
    {label:"Week 3 — Data & Security for AI on AWS", topics:["Glue, Athena, OpenSearch, Lake Formation in an AI context","GenAI security and governance"],
     build:"A data pipeline feeding an AI service with governance controls applied.", outcome:"Builds AI systems on AWS that pass a security review, not just a demo."},
    {label:"Week 4 — Certification Push", topics:["Full exam-guide breakdown","Mock exam and gap review"],
     build:"Capstone: a full AIF-C01 mock exam plus weak-area drill.", outcome:"Exam-ready for AWS Certified AI Practitioner."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=4rF3xsCeJHQ", s:"YouTube — AWS Machine Learning Certification, Full Course"}
  ]
},
{
  code:"AI-18", category:"Cloud AI", title:"GCP AI",
  tagline:"Building and deploying on Google Cloud's AI stack — Vertex AI, Gemini, and production ML pipelines.",
  weeks:[
    {label:"Week 1 — Vertex AI Platform Overview", topics:["AutoML, custom training, Model Garden","When to use which approach"],
     build:"Train a model both ways — AutoML and custom — on the same dataset.", outcome:"Knows which Vertex AI path fits a given problem."},
    {label:"Week 2 — Building with Gemini", topics:["Vertex AI Studio","Prompting and tuning Gemini","Multimodal use cases"],
     build:"A Gemini-powered feature via Vertex AI Studio.", outcome:"Comfortable building real generative features on GCP, not just calling an API in isolation."},
    {label:"Week 3 — Production Pipelines", topics:["Vertex AI Pipelines for MLOps","Component orchestration","Monitoring and cleanup"],
     build:"An end-to-end Vertex AI Pipeline for a real prediction task.", outcome:"Has a reproducible, production-style pipeline on GCP."},
    {label:"Week 4 — RAG & Deployment", topics:["Building a private knowledge base / RAG search app","Deployment, scaling, and cost management"],
     build:"Capstone: a RAG-powered search app on your own data, deployed on GCP.", outcome:"Ships a real GCP-hosted GenAI product end to end."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=DOXJ7s1D6iE", s:"YouTube — Generative AI Bootcamp, Complete 65-Hour Course"}
  ]
},
{
  code:"AI-19", category:"AI Security", title:"AI LLM Testing",
  tagline:"Quality engineering for AI systems — testing non-deterministic LLM and RAG outputs the way QA tests deterministic code.",
  weeks:[
    {label:"Week 1 — Why AI Testing Is Different", topics:["Non-determinism and data drift","Key quality attributes: accuracy, fairness, robustness, explainability"],
     build:"A test plan adapted for a non-deterministic AI feature.", outcome:"Stops applying deterministic QA logic to a probabilistic system."},
    {label:"Week 2 — Evaluation Metrics & Golden Datasets", topics:["Faithfulness and relevancy metrics","Building golden datasets","LLM-as-judge validation"],
     build:"A golden dataset and eval harness for a real LLM feature.", outcome:"Can prove — with numbers — whether an AI feature actually works."},
    {label:"Week 3 — Tooling: DeepEval & RAGAS", topics:["Hands-on automated AI evals","Integrating evals into CI","Prompt regression testing"],
     build:"Wire DeepEval / RAGAS into a CI pipeline.", outcome:"AI quality regressions get caught in CI, not by angry users."},
    {label:"Week 4 — End-to-End AI Testing Project", topics:["UI automation (Playwright-style) combined with model output validation","Full bug reporting for AI findings"],
     build:"Capstone: a complete AI testing project covering both UI automation and output validation.", outcome:"Can run AI QA the way a real QA team would expect it delivered."}
  ],
  resources:[
    {u:"https://www.youtube.com/watch?v=JojcJe5dJTI", s:"YouTube — Don't Guess: How to Benchmark Your AI Prompts"}
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

    const moduleRows = c.weeks.map((w, i) => {
      const resource = c.resources[i % c.resources.length];
      return {
        course_id: course.id,
        title: w.label.replace(/^Week \d+ — /, ""),
        video_url: resource.u,
        video_source_label: sourceLabel(resource.u, resource),
        topics: w.topics ?? [],
        build_deliverable: w.build ?? null,
        outcome: w.outcome ?? null,
        order_index: i,
      };
    });

    const { error: modErr } = await supabase.from("modules").insert(moduleRows);
    if (modErr) {
      console.error(`FAILED modules for ${c.code}:`, modErr.message);
      continue;
    }

    console.log(`OK  ${c.code}  ${slug}  ₹${price}  ${moduleRows.length} modules (with topics/build/outcome)`);
  }
}

main().then(() => {
  console.log("done");
  process.exit(0);
});
