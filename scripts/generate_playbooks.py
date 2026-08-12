"""
Generates a real, branded PDF playbook per course (replacing the plain
.md files) and uploads each to Supabase Storage, updating the `playbooks`
table to point at the new PDF. Run: python3 scripts/generate_playbooks.py
"""
import os
import re
import requests
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_LEFT
from io import BytesIO

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    env = {}
    with open(os.path.join(BASE, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"')
    return env

env = load_env()
SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}

# Brand colors (matches tailwind.config.ts)
NAVY = colors.HexColor("#141E33")
GOLD = colors.HexColor("#F0A81E")
INK_600 = colors.HexColor("#4B5568")
INK_200 = colors.HexColor("#DCE1E8")
SUCCESS = colors.HexColor("#1E9E6F")

styles = getSampleStyleSheet()
title_style = ParagraphStyle("RopesTitle", parent=styles["Title"], fontName="Helvetica-Bold",
                              fontSize=24, textColor=NAVY, spaceAfter=6, alignment=TA_LEFT)
kicker_style = ParagraphStyle("Kicker", parent=styles["Normal"], fontName="Helvetica-Bold",
                               fontSize=9, textColor=GOLD, spaceAfter=10, alignment=TA_LEFT)
tagline_style = ParagraphStyle("Tagline", parent=styles["Normal"], fontSize=11.5,
                                textColor=INK_600, leading=16, spaceAfter=4)
meta_style = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9.5, textColor=INK_600)
week_heading = ParagraphStyle("WeekHeading", parent=styles["Heading2"], fontName="Helvetica-Bold",
                               fontSize=15, textColor=NAVY, spaceBefore=18, spaceAfter=8)
label_style = ParagraphStyle("Label", parent=styles["Normal"], fontName="Helvetica-Bold",
                              fontSize=9.5, textColor=NAVY, spaceAfter=3, spaceBefore=8)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#1A1F2B"),
                             leading=15)
bullet_style = ParagraphStyle("Bullet", parent=body_style, leftIndent=14, bulletIndent=2, spaceAfter=3)
check_style = ParagraphStyle("Check", parent=body_style, leftIndent=14, spaceAfter=3, textColor=INK_600)
note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=8.5, textColor=INK_600, leading=12)


def esc(s):
    """Escape raw data text for insertion into a ReportLab Paragraph, which
    parses its content as a small XML/HTML dialect — an unescaped literal
    '&' (e.g. "ATT&CK", "W&B", or a '?a=1&b=2' URL) breaks the parser or
    renders wrong. Call this on every dynamic string; wrap it, don't escape
    the markup (<b>, &bull;, &nbsp;) this script writes itself."""
    if s is None:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# Mirrors src/components/marketing/earnings-illustration.tsx — kept in sync
# manually since this is a one-off generation script, not app runtime code.
EARNINGS_BY_TRACK = {
    "Agentic Systems": ("Agent-building retainer", [
        ("Starting out", 20000, "1 client, single agent"),
        ("Building a base", 45000, "2 clients, ongoing support"),
        ("Established", 80000, "3+ clients, multi-agent systems"),
    ]),
    "AI Engineering": ("AI feature consulting", [
        ("Starting out", 25000, "1 client, single feature"),
        ("Building a base", 50000, "2 clients, ongoing builds"),
        ("Established", 90000, "3+ clients, full-stack AI work"),
    ]),
    "Dev Tooling": ("AI-assisted dev retainer", [
        ("Starting out", 18000, "1 client, part-time support"),
        ("Building a base", 40000, "2 clients, regular delivery"),
        ("Established", 70000, "3+ clients, team-level workflows"),
    ]),
    "No-Code Automation": ("Automation build + retainer", [
        ("Starting out", 15000, "1 client, one automation"),
        ("Building a base", 45000, "3 clients, maintained workflows"),
        ("Established", 75000, "3 clients, larger monthly retainers"),
    ]),
    "AI Operations": ("Ops & observability retainer", [
        ("Starting out", 30000, "1 client, monitoring setup"),
        ("Building a base", 60000, "2 clients, ongoing ops"),
        ("Established", 100000, "3+ clients, on-call retainer"),
    ]),
    "AI Strategy": ("Fractional AI PM engagement", [
        ("Starting out", 35000, "1 client, part-time advisory"),
        ("Building a base", 70000, "2 clients, roadmap ownership"),
        ("Established", 120000, "2–3 clients, fractional AI PM"),
    ]),
    "Data & ML": ("Analytics & ML consulting", [
        ("Starting out", 20000, "1 client, one analysis project"),
        ("Building a base", 45000, "2 clients, recurring reporting"),
        ("Established", 80000, "3+ clients, ongoing ML work"),
    ]),
    "AI Security": ("Security review retainer", [
        ("Starting out", 25000, "1 client, single review"),
        ("Building a base", 55000, "2 clients, periodic audits"),
        ("Established", 90000, "3+ clients, ongoing monitoring"),
    ]),
    "Cloud AI": ("Cloud AI implementation", [
        ("Starting out", 22000, "1 client, single deployment"),
        ("Building a base", 48000, "2 clients, ongoing support"),
        ("Established", 85000, "3+ clients, multi-cloud work"),
    ]),
}
DEFAULT_EARNINGS = ("Freelance retainer", [
    ("Starting out", 15000, "1 client"),
    ("Building a base", 40000, "2–3 clients"),
    ("Established", 75000, "3+ clients"),
])

# Where a student in each track would realistically go looking for a first
# client — concrete, not "network more." Kept short and practical.
CLIENT_CHANNELS_BY_TRACK = {
    "Agentic Systems": [
        "Small agencies already doing manual research/outreach — offer to automate one workflow free as a trial.",
        "r/automation, r/nocode, and AI-agent Discord/Slack communities — post your capstone build.",
        "LinkedIn: comment with a working demo on posts from founders complaining about repetitive tasks.",
    ],
    "AI Engineering": [
        "Startups job-posting for an 'AI engineer' but not ready to hire full-time — pitch a paid pilot instead.",
        "Indie SaaS founders on Twitter/X and Indie Hackers who mention wanting an AI feature.",
        "Former colleagues or managers — the fastest first client is someone who already trusts your work.",
    ],
    "Dev Tooling": [
        "Dev teams at your current or former employer — pitch a short paid workshop on AI-assisted workflows.",
        "Freelance dev marketplaces (Upwork, Toptal) — lead with 'ship faster using Claude Code,' not generic dev work.",
        "Local tech meetups and dev communities — offer a live demo, collect leads afterward.",
    ],
    "No-Code Automation": [
        "Local service businesses (clinics, agencies, real-estate) drowning in manual admin work.",
        "Facebook/LinkedIn groups for small-business owners — post a before/after of one automation you built.",
        "Fiverr/Upwork n8n-specific gigs — undercut on price for your first 2–3 reviews, then raise rates.",
    ],
    "AI Operations": [
        "Startups with an AI feature already in production but no monitoring — a real, findable gap.",
        "DevOps/SRE communities (Slack, Discord) — offer a free observability audit as a lead-in.",
        "Companies posting 'AIOps' or 'LLMOps' roles they can't fill full-time — pitch fractional support.",
    ],
    "AI Strategy": [
        "Startup founders you already know who are unsure what to build with AI — offer a paid discovery sprint.",
        "Product communities (Lenny's, PM Slack groups) — share your PRD/roadmap frameworks publicly first.",
        "Fractional-exec marketplaces — list yourself specifically as a fractional AI PM, not a generalist.",
    ],
    "Data & ML": [
        "E-commerce or D2C brands who mention wanting 'better insights' but have no analyst — direct message with a sample dashboard.",
        "Kaggle/data-science communities — showcase your capstone project, link to a booking page.",
        "Small businesses with messy spreadsheets — a paid one-off cleanup + dashboard is an easy first sale.",
    ],
    "AI Security": [
        "Startups shipping an LLM feature fast with no security review — cold-email a free vulnerability summary.",
        "AI/security Discord and LinkedIn groups — post your red-team findings from the capstone (sanitized).",
        "Compliance-heavy industries (fintech, healthtech) entering AI — they need this and know it.",
    ],
    "Cloud AI": [
        "Businesses migrating off spreadsheets/legacy tools who mention 'AI' in a job post but can't hire full-time.",
        "Cloud provider partner/marketplace directories (Azure, AWS, GCP) — list a fixed-scope implementation package.",
        "Local IT consultancies who need a cloud-AI subcontractor for client projects.",
    ],
}
DEFAULT_CHANNELS = [
    "People you already know — a former colleague, manager, or client is your fastest first booking.",
    "Relevant subreddits, Discord servers, and LinkedIn groups for this track — share your capstone build.",
    "Freelance marketplaces (Upwork, Fiverr) — price low for your first 2–3 reviews, then raise your rate.",
]

# Mirrors src/lib/industry-data.ts — real, cited research (tools, market
# signal, resources, certifications), kept in sync manually since this is a
# one-off generation script, not app runtime code. Every fact has a source;
# nothing here is a fabricated stat.
INDUSTRY_DATA = {
    "agentic-ai": {
        "tools": [
            ("LangGraph", "Graph-based orchestration for stateful, long-running agents; reached v1.0 in late 2025."),
            ("CrewAI", "Role-based multi-agent framework built for fast prototyping."),
            ("OpenAI Agents SDK", "OpenAI's code-first framework for agents, handoffs, and guardrails."),
            ("Claude Agent SDK", "Anthropic's SDK for building custom agents on Claude Code's infrastructure."),
            ("Model Context Protocol (MCP)", "Open standard (Anthropic, now Linux Foundation) most agent frameworks use to connect to tools."),
        ],
        "facts": [
            ("Searches for AI-agent implementation expertise on Fiverr surged 18,347% over six months.", "Fiverr Spring 2025 Business Trends Index"),
            ("Demand for AI-tied freelance skills on Upwork grew 109% year-over-year in 2025.", "Upwork 2026 In-Demand Skills report"),
            ("AI agents' success rate on real-world computer tasks rose from about 12% to 66% in roughly 18 months.", "Stanford HAI data, reported by Forbes, April 2026"),
        ],
        "resources": [
            ("ReAct: Synergizing Reasoning and Acting in Language Models", "https://arxiv.org/abs/2210.03629"),
            ("Toolformer", "https://arxiv.org/abs/2302.04761"),
            ("Model Context Protocol docs", "https://modelcontextprotocol.io/docs/getting-started/intro"),
            ("Anthropic Engineering blog", "https://www.anthropic.com/engineering"),
            ("Introduction to MCP (free course)", "https://anthropic.skilljar.com/introduction-to-model-context-protocol"),
        ],
        "certification": "No independently accredited \"agentic AI\" certification exists yet. LangChain Academy and Anthropic Academy both issue free, LinkedIn-shareable completion certificates.",
    },
    "agentic-ai-development-with-langchain-langgraph": {
        "tools": [
            ("LangGraph", "Low-level graph orchestration for stateful agents; used in production by Klarna, Uber, and J.P. Morgan."),
            ("LangChain", "The broader framework LangGraph extends — chains, memory, and tool integrations."),
            ("CrewAI", "A faster-to-prototype alternative worth knowing for comparison."),
            ("Model Context Protocol (MCP)", "The tool-connection standard LangGraph agents increasingly rely on."),
        ],
        "facts": [
            ("LangGraph is used in production by Klarna, Uber, and J.P. Morgan.", "LangChain's official langchain.com/langgraph page"),
            ("Demand for AI-tied freelance skills on Upwork grew 109% year-over-year in 2025.", "Upwork 2026 In-Demand Skills report"),
        ],
        "resources": [
            ("LangGraph official docs", "https://docs.langchain.com/oss/python/langgraph/overview"),
            ("LangChain Academy (free, certificate-eligible)", "https://academy.langchain.com/"),
            ("LangChain Academy GitHub", "https://github.com/langchain-ai/langchain-academy"),
            ("LangGraph GitHub", "https://github.com/langchain-ai/langgraph"),
            ("AI Agents in LangGraph (DeepLearning.AI)", "https://www.deeplearning.ai/courses/ai-agents-in-langgraph"),
        ],
        "certification": "No independently accredited \"LangGraph\" certification exists yet. LangChain Academy issues free, LinkedIn-shareable completion certificates for its courses.",
    },
    "claude-code-ai": {
        "tools": [
            ("Claude Code", "Anthropic's agentic terminal coding tool — multi-file changes, git workflows, and CI integration."),
            ("Claude Agent SDK", "Build custom coding/ops agents on the same infrastructure as Claude Code."),
            ("GitHub Copilot", "The longest-established AI pair programmer; added Agent Mode in 2025."),
            ("Cursor", "An AI-native code editor built as a VS Code fork."),
            ("Model Context Protocol (MCP)", "The extensibility layer Claude Code uses to connect to external tools."),
        ],
        "facts": [
            ("Claude Code reached $1 billion in run-rate revenue in November 2025 — six months after general availability, and Anthropic's fastest-growing enterprise product ever.", "Anthropic official announcement, November 2025"),
            ("Anthropic names Netflix, Spotify, KPMG, L'Oreal, and Salesforce directly as Claude Code enterprise customers; enterprise use is over half of Claude Code's revenue.", "Anthropic official announcement"),
            ("Coding is the largest category of enterprise AI spend — $4.0 billion, 55% of departmental AI budgets — and Anthropic's enterprise LLM API market share tripled to 40% in 2025.", "Menlo Ventures, \"2025 State of Generative AI in the Enterprise\", December 2025"),
        ],
        "resources": [
            ("Claude Code official docs", "https://code.claude.com/docs/en/quickstart"),
            ("Claude Code GitHub repo", "https://github.com/anthropics/claude-code"),
            ("Claude Code in Action (free course)", "https://anthropic.skilljar.com/claude-code-in-action"),
            ("Claude prompting best practices", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices"),
            ("Interactive prompt engineering tutorial", "https://github.com/anthropics/prompt-eng-interactive-tutorial"),
        ],
        "certification": "Anthropic runs a real certification pathway — Claude Certified Associate, Developer, and Architect — delivered through Pearson VUE, with free prep courses on Anthropic Academy.",
    },
    "ai-stack": {
        "tools": [
            ("LangChain", "General-purpose framework for chains, agents, and memory."),
            ("LlamaIndex", "Framework specialized for data ingestion and RAG pipelines."),
            ("Pinecone", "Managed vector database for RAG retrieval, with an official LlamaIndex integration."),
            ("Hugging Face", "Model hub and libraries underpinning most open-source AI stacks."),
            ("Model Context Protocol (MCP)", "The interoperability layer connecting these pieces to external tools."),
        ],
        "facts": [
            ("LinkedIn's 2025 \"Jobs on the Rise\" report ranked AI Engineer the #1 fastest-growing job title in the US.", "LinkedIn 2025 Jobs on the Rise report"),
            ("The share of US job postings mentioning AI reached 4.2% by the end of 2025, and GenAI could highly transform 26% of jobs posted in the prior year.", "Indeed Hiring Lab, January 2026"),
            ("Enterprise GenAI spend grew from roughly $1.7 billion in 2023 to $37 billion in 2025 — a scale-up that took SaaS 15+ years to reach.", "Menlo Ventures, December 2025"),
        ],
        "resources": [
            ("LangChain docs", "https://docs.langchain.com"),
            ("LlamaIndex docs", "https://docs.llamaindex.ai"),
            ("Hugging Face Learn", "https://huggingface.co/learn"),
            ("OpenAI Cookbook", "https://cookbook.openai.com"),
            ("Model Context Protocol docs", "https://modelcontextprotocol.io/docs/getting-started/intro"),
        ],
        "certification": "No formal \"AI stack\" certification exists. The closest real credentials are Anthropic's Claude certifications and the cloud providers' GenAI certifications.",
    },
    "ai-engineering-for-forward-deployed-engineer": {
        "tools": [
            ("Claude Agent SDK", "For building embedded, client-facing agent tooling."),
            ("Google Agent Development Kit (ADK)", "Enterprise multi-agent deployment toolkit."),
            ("LangGraph", "Production orchestration for the systems FDEs typically ship."),
            ("Model Context Protocol (MCP)", "The core skill for wiring an agent into a client's existing systems."),
        ],
        "facts": [
            ("OpenAI, Anthropic, Google Cloud, Palantir, Salesforce, Databricks, Adobe, and Scale AI all now hire Forward Deployed Engineer-style roles.", "MarkTechPost, May 2026"),
            ("Palantir originated the Forward Deployed Engineer role — embedding engineers directly with clients to ship production software.", "Widely documented; Palantir's own careers pages"),
            ("Industry compensation trackers report mid-to-senior FDE packages commonly in the $220,000-$550,000 range at OpenAI, Anthropic, and Palantir.", "Market-reported by industry compensation trackers, not an audited primary source — treat as directional"),
        ],
        "resources": [
            ("Anthropic Engineering blog", "https://www.anthropic.com/engineering"),
            ("Google ADK docs", "https://google.github.io/adk-docs/"),
            ("LangGraph production/deployment docs", "https://docs.langchain.com/oss/python/langgraph/overview"),
            ("Model Context Protocol docs", "https://modelcontextprotocol.io/docs/getting-started/intro"),
        ],
        "certification": "No formal \"Forward Deployed Engineer\" certification exists — it's a role pattern, not a credential. Anthropic's Claude certification pathway is the closest concretely relevant credential.",
    },
    "generative-ai-genai": {
        "tools": [
            ("OpenAI / Anthropic APIs", "The two leading foundation-model providers most GenAI products build on."),
            ("Prompt engineering techniques", "Structured prompting, few-shot examples, and evaluation loops."),
            ("Hugging Face", "Open-source models and libraries for GenAI development."),
            ("LangChain", "Framework for chaining prompts, memory, and tools into applications."),
        ],
        "facts": [
            ("Enterprise generative AI usage rose from 33% to 71% of organizations between 2023 and 2024; overall AI adoption rose from 55% to 78%.", "Stanford HAI 2025 AI Index Report"),
            ("Generative AI attracted $33.9 billion in global private investment in 2024, up 18.7% from 2023.", "Stanford HAI 2025 AI Index Report"),
        ],
        "resources": [
            ("Generative AI for Everyone (Andrew Ng, free)", "https://www.coursera.org/learn/generative-ai-for-everyone"),
            ("DeepLearning.AI course catalog", "https://www.deeplearning.ai/courses"),
            ("OpenAI Cookbook", "https://cookbook.openai.com"),
            ("Anthropic prompt engineering overview", "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"),
            ("Prompting Guide", "https://www.promptingguide.ai"),
        ],
        "certification": "Google Cloud's Generative AI Leader certification (no-code, launched 2025) and AWS's Certified AI Practitioner are both real, active, foundational credentials.",
    },
    "ai-agents-with-n8n-no-code": {
        "tools": [
            ("n8n", "Open-source, self-hostable workflow automation platform with ~70 AI/agent nodes as of its 2026 release."),
            ("Zapier Agents", "8,000+ app integrations with autonomous multi-app task execution."),
            ("Make.com", "Visual scenario builder with an AI assistant that drafts automations from plain language."),
            ("LangChain", "The framework n8n's AI nodes are built on under the hood."),
        ],
        "facts": [
            ("n8n raised a $180M Series C in October 2025 at a $2.5B valuation, reaching $40M ARR with 230,000+ active users and 3,000+ enterprise customers including Vodafone, Delivery Hero, and Microsoft.", "TechFundingNews / Sacra, October 2025"),
            ("Vodafone reports GBP 2.2M in operational cost savings from n8n-based security threat-intelligence automation; Delivery Hero saves 200 hours a month via a single workflow; Field Aerospace cut proposal generation from two weeks to 25 minutes.", "n8n's own published customer case studies, n8n.io/case-studies"),
        ],
        "resources": [
            ("n8n docs", "https://docs.n8n.io"),
            ("n8n Academy (free courses + certification)", "https://learn.n8n.io"),
            ("n8n community forum", "https://community.n8n.io"),
            ("n8n workflow template library", "https://n8n.io/workflows"),
            ("n8n case studies", "https://n8n.io/case-studies"),
        ],
        "certification": "n8n's own free Level 1 Beginner Certification, issued through n8n Academy, is real and currently available.",
    },
    "ai-agents-for-devops-engineers": {
        "tools": [
            ("GitHub Copilot (Workspace, Autofix)", "Extended into full issue-to-PR workflows and automated vulnerability fixes."),
            ("Datadog Bits AI", "Generative-AIOps assistant for alert investigation and root-cause analysis."),
            ("PagerDuty AIOps", "ML-based alert correlation and incident-response automation."),
            ("incident.io", "AI-assisted incident response and on-call workflow platform."),
        ],
        "facts": [
            ("Google's SRE book and workbook remain the canonical, free reference for the operational practices these AI copilots layer on top of.", "sre.google (Google's official SRE publication)"),
        ],
        "resources": [
            ("Site Reliability Engineering (free book)", "https://sre.google"),
            ("GitHub Copilot docs", "https://docs.github.com/copilot"),
            ("awesome-ai-sre (curated list)", "https://github.com/agamm/awesome-ai-sre"),
            ("Datadog docs", "https://docs.datadoghq.com"),
            ("PagerDuty developer docs", "https://developer.pagerduty.com"),
        ],
        "certification": "No AI-agent-specific DevOps certification exists yet. Standard cloud DevOps certifications (e.g. AWS DevOps Engineer Professional) remain the credentialed baseline.",
    },
    "mlops-machine-learning-operations": {
        "tools": [
            ("MLflow", "Open-source experiment tracking, model registry, and deployment."),
            ("Weights & Biases", "Managed experiment tracking and collaboration, with a strong free tier."),
            ("Kubeflow", "Kubernetes-native ML pipeline orchestration and model serving."),
            ("DVC", "Open-source data and model version control, commonly paired with MLflow."),
        ],
        "facts": [
            ("Uber's Michelangelo platform, built from around 2015, is one of the best-documented production MLOps systems — running thousands of models in production across fraud detection, ETA prediction, and marketplace forecasting.", "Widely documented industry case study"),
            ("The global MLOps market is estimated at $3.3-$4.4 billion in 2026 by different research firms, projected to reach $57-$90 billion by 2034-2035.", "Precedence Research and Fortune Business Insights (estimates vary by methodology)"),
        ],
        "resources": [
            ("MLflow docs", "https://mlflow.org/docs/latest/index.html"),
            ("Weights & Biases docs", "https://docs.wandb.ai"),
            ("Kubeflow docs", "https://www.kubeflow.org/docs/"),
            ("DVC docs", "https://dvc.org/doc"),
            ("ml-ops.org", "https://ml-ops.org"),
        ],
        "certification": "Real, currently active credentials: AWS Certified Machine Learning Engineer - Associate ($150), Google Cloud Professional Machine Learning Engineer ($200), and Microsoft Azure Data Scientist Associate ($165).",
    },
    "aiops": {
        "tools": [
            ("Datadog (Watchdog, Bits AI)", "Unified observability with automated anomaly detection."),
            ("Dynatrace (Davis AI)", "AI engine for automated incident resolution, strong in hybrid/on-prem."),
            ("PagerDuty", "Alert correlation and on-call workflow automation."),
            ("Moogsoft / BigPanda", "Purpose-built event-correlation and noise-reduction platforms."),
        ],
        "facts": [
            ("AIOps market-size estimates vary widely by research firm — from roughly $2.7B to $19B for 2026 depending on how the market is defined, with the platform segment projected to reach $32.4B by 2028 from $11.7B in 2023.", "MarketsandMarkets, Fortune Business Insights, Mordor Intelligence (ranges vary by methodology)"),
        ],
        "resources": [
            ("awesome-ai-sre (curated list)", "https://github.com/agamm/awesome-ai-sre"),
            ("Google SRE resource library", "https://sre.google/resources/"),
            ("Datadog docs", "https://docs.datadoghq.com"),
            ("Dynatrace docs", "https://www.dynatrace.com/support/help/"),
            ("PagerDuty docs", "https://support.pagerduty.com"),
        ],
        "certification": "No dedicated, widely-recognized AIOps certification exists yet from a major vendor or standards body.",
    },
    "llmops": {
        "tools": [
            ("LangSmith", "LangChain's hosted LLM tracing, evaluation, and observability platform."),
            ("Langfuse", "Open-source LLM observability, tracing, and prompt management."),
            ("Arize / Phoenix", "LLM observability and evaluation, including an open-source option."),
            ("W&B Weave", "Weights & Biases' LLM-specific observability and evaluation layer."),
        ],
        "facts": [
            ("The LLMOps software market is projected to grow from $5.88B (2025) to $7.14B (2026), reaching $15.59B by 2030.", "Research and Markets"),
            ("Wordsmith, a legal AI company, used LangSmith to compare models and shipped a Claude 3.5 upgrade to production the same day it released — cutting cost on suitable tasks up to 10x.", "LangChain's official customer blog, langchain.com/blog/customers-wordsmith"),
            ("SumUp runs Langfuse across 4M+ merchants for AI-powered first-level support.", "Langfuse's own customer page, langfuse.com/users/sumup"),
        ],
        "resources": [
            ("LangSmith docs", "https://docs.smith.langchain.com"),
            ("Langfuse docs", "https://langfuse.com/docs"),
            ("Langfuse GitHub", "https://github.com/langfuse/langfuse"),
            ("Arize / Phoenix docs", "https://docs.arize.com/phoenix"),
            ("MLflow LLMs & Agents docs", "https://mlflow.org/docs/latest/index.html"),
        ],
        "certification": "No dedicated, currently-valid LLMOps certification exists yet from a recognized vendor or standards body.",
    },
    "ai-product-management": {
        "tools": [
            ("Amplitude", "Enterprise product analytics with predictive/behavioral cohorting."),
            ("PostHog", "Open-source, all-in-one analytics, session replay, and A/B testing."),
            ("Braintrust", "Eval-first platform for testing whether a prompt or model change actually improved output quality."),
            ("LangSmith", "Trace-first LLM observability, useful for debugging production AI features."),
        ],
        "facts": [
            ("LinkedIn's 2026 \"Jobs on the Rise\" report ranks AI Engineer #1 and AI Consultant/Strategist #2 among the fastest-growing US roles; Product Manager is a documented top feeder role into both.", "LinkedIn's official 2026 Jobs on the Rise report"),
            ("Netflix posted a fully-remote Generative AI Product Manager role in September 2025 with a published salary range of $240,000-$700,000 a year.", "Fortune, October 2025"),
            ("Reforge's AI Product Management curriculum teaches writing AI-specific PRDs that cover embeddings, retrieval tradeoffs, and post-launch evaluation loops.", "reforge.com/course-categories/ai"),
        ],
        "resources": [
            ("Reforge — AI Product Management", "https://www.reforge.com/course-categories/ai"),
            ("Mind the Product", "https://www.mindtheproduct.com/"),
            ("Product School AI PM Certification", "https://productschool.com/certifications/ai-for-product-managers"),
            ("AIPMM certification body", "https://aipmm.com/certification"),
            ("Stanford HAI AI Index Report", "https://hai.stanford.edu/ai-index"),
        ],
        "certification": "Real, active credentials: AIPMM's CPM/CPMM/CBM certifications and Product School's AI Product Management Certification ($2,999).",
    },
    "data-science-ai-ml": {
        "tools": [
            ("pandas / NumPy", "Core Python data manipulation — still foundational in 2026 curricula."),
            ("scikit-learn", "Still the default for most enterprise classification and regression tasks."),
            ("PyTorch", "The de facto standard for model training."),
            ("Hugging Face Transformers", "500,000+ pretrained models; the standard entry point for applied NLP."),
        ],
        "facts": [
            ("The median annual wage for Data Scientists was $112,590 (May 2024), with 34% projected employment growth from 2024 to 2034 — much faster than average — and about 23,400 average annual openings.", "US Bureau of Labor Statistics, Occupational Outlook Handbook"),
            ("Python remains the single most in-demand specialized AI skill, appearing in 258,674 job postings — up 391% versus its 2013-15 baseline.", "Stanford HAI 2025 AI Index Report"),
        ],
        "resources": [
            ("scikit-learn User Guide", "https://scikit-learn.org/stable/user_guide.html"),
            ("PyTorch tutorials", "https://pytorch.org/tutorials/"),
            ("Kaggle Learn", "https://www.kaggle.com/learn"),
            ("Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course"),
            ("fast.ai — Practical Deep Learning for Coders", "https://course.fast.ai/"),
        ],
        "certification": "Real, active credentials: the Google Advanced Data Analytics Professional Certificate, AWS Certified Machine Learning Engineer - Associate, and AWS Certified Machine Learning - Specialty.",
    },
    "data-science-with-generative-ai": {
        "tools": [
            ("LangGraph / LlamaIndex", "Agentic workflow orchestration and RAG-specific data pipelines."),
            ("Hugging Face", "Open-source models and libraries for GenAI-augmented data science."),
            ("dbt", "Standard tool for SQL-based data transformation pipelines."),
            ("scikit-learn / PyTorch", "The base ML stack GenAI workflows sit on top of."),
        ],
        "facts": [
            ("Instacart's own engineering team documents using GitHub Copilot, OpenAI models, and an internal \"LLM-Assisted Chatbot Evaluation\" framework across its data science organization.", "Instacart's official company blog"),
            ("GitHub's own Duolingo case study reports a 25% developer-speed increase for engineers new to a codebase (10% for experienced engineers) after Copilot integration.", "GitHub official customer case study"),
            ("\"Agentic AI\" skill-cluster job postings grew more than 280% in one year, to roughly 90,000 US postings.", "Stanford HAI 2025 AI Index Report"),
        ],
        "resources": [
            ("Hugging Face NLP Course", "https://huggingface.co/learn"),
            ("LangChain / LangGraph docs", "https://python.langchain.com/"),
            ("arXiv.org", "https://arxiv.org"),
            ("dbt docs", "https://docs.getdbt.com/"),
            ("Instacart Engineering Blog", "https://company.instacart.com/updates/how-generative-ai-is-revolutionizing-data-science"),
        ],
        "certification": "Real, active credentials: the Google Advanced Data Analytics Professional Certificate and AWS's Machine Learning certifications.",
    },
    "ai-security": {
        "tools": [
            ("OWASP Top 10 for LLM Applications", "Community-ranked list of top LLM app risks; prompt injection has ranked #1 for two consecutive editions."),
            ("NVIDIA garak", "Open-source LLM vulnerability scanner covering prompt injection, jailbreaks, and data leakage."),
            ("Microsoft PyRIT", "Open-source, model-agnostic red-teaming automation framework."),
            ("MITRE ATLAS", "An ATT&CK-style knowledge base of adversary techniques specific to AI systems."),
        ],
        "facts": [
            ("41% of security professionals cite AI as a critical skill gap on their team — the top-cited gap for the second year running, ahead of cloud security at 36%.", "(ISC)2 2025 Cybersecurity Workforce Study"),
            ("61% of security professionals cite generative AI/LLMs as the leading tech priority for 2026; 59% cite AI-driven social engineering as the most significant threat organizations face.", "ISACA 2025 State of Cybersecurity survey"),
            ("Microsoft 365 Copilot's \"EchoLeak\" zero-click prompt-injection flaw (CVSS 9.3) let attackers exfiltrate sensitive documents via a crafted email — disclosed June 2025.", "Widely reported security disclosure"),
            ("A Canadian tribunal held Air Canada liable in February 2024 after its website chatbot gave a customer incorrect fare-policy information.", "CBC News / Forbes, February 2024"),
        ],
        "resources": [
            ("OWASP Top 10 for LLM Applications (2025)", "https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/"),
            ("NIST AI Risk Management Framework, Generative AI Profile", "https://www.nist.gov/itl/ai-risk-management-framework"),
            ("MITRE ATLAS", "https://atlas.mitre.org"),
            ("Microsoft PyRIT", "https://github.com/Azure/PyRIT"),
            ("NVIDIA garak", "https://github.com/NVIDIA/garak"),
        ],
        "certification": "ISACA's AAISM (launched August 2025, requires CISM or CISSP) and new SANS/GIAC AI security certifications (GAIPS, GASAE) are real and current. ISC2's dedicated AI Security certification is still in development, with a pilot exam expected in late 2026.",
    },
    "ai-llm-testing": {
        "tools": [
            ("Promptfoo", "Open-source LLM red-teaming and testing tool covering 50+ vulnerability classes, CI/CD-ready."),
            ("NVIDIA garak", "Open-source vulnerability scanner for prompt injection, jailbreaks, and hallucination."),
            ("Microsoft PyRIT", "Automated, multi-turn red-teaming framework."),
            ("OWASP GenAI Security Project", "The broader project hub behind the OWASP LLM Top 10."),
        ],
        "facts": [
            ("41% of security professionals cite AI as a critical skill gap on their team.", "(ISC)2 2025 Cybersecurity Workforce Study"),
            ("Prompt injection has ranked #1 on the OWASP Top 10 for LLM Applications for two consecutive editions.", "OWASP GenAI Security Project"),
        ],
        "resources": [
            ("Promptfoo red-team docs", "https://www.promptfoo.dev/docs/red-team/"),
            ("NVIDIA garak", "https://github.com/NVIDIA/garak"),
            ("Microsoft PyRIT docs", "https://microsoft.github.io/PyRIT/"),
            ("OWASP GenAI Security Project", "https://genai.owasp.org/"),
            ("MITRE ATLAS case studies", "https://atlas.mitre.org"),
        ],
        "certification": "Same real, current pathway as AI Security: ISACA's AAISM and SANS/GIAC's new AI security certifications (GAIPS, GASAE).",
    },
    "azure-ai": {
        "tools": [
            ("Microsoft Foundry", "Renamed from \"Azure AI Foundry\" at Microsoft Ignite, November 18, 2025 — the unified environment for building AI apps and agents."),
            ("Azure AI Services", "Rebranded from \"Azure AI Foundry Tools\"; pre-built AI capabilities (vision, language, speech)."),
            ("Azure OpenAI", "Microsoft's managed access to OpenAI's models on Azure infrastructure."),
        ],
        "facts": [
            ("Microsoft renamed \"Azure AI Foundry\" to \"Microsoft Foundry\" at Ignite on November 18, 2025 — course material uses the current name.", "InfoWorld / Directions on Microsoft, November 2025"),
            ("The \"Azure AI Engineer Associate\" (AI-102) certification was retired on June 30, 2026. Its replacement, AI-103, leads to the \"Azure AI Apps and Agents Developer Associate\" credential.", "Microsoft Learn's official certification page (fetched directly)"),
        ],
        "resources": [
            ("Microsoft Foundry docs", "https://learn.microsoft.com/en-us/azure/ai-foundry/"),
            ("Azure AI Services documentation hub", "https://learn.microsoft.com/en-us/azure/ai-services/"),
            ("Microsoft Learn AI certifications catalog", "https://learn.microsoft.com/en-us/credentials/browse/?products=azure&subjects=artificial-intelligence"),
            ("Azure OpenAI docs", "https://learn.microsoft.com/en-us/azure/ai-services/openai/"),
        ],
        "certification": "AI-102 (\"Azure AI Engineer Associate\") was retired June 30, 2026. The current path is AI-103, leading to \"Azure AI Apps and Agents Developer Associate.\"",
    },
    "aws-ai": {
        "tools": [
            ("Amazon Bedrock", "AWS's managed foundation-model service — 100,000+ customers as of re:Invent 2025."),
            ("Amazon SageMaker", "AWS's platform for building, training, and deploying custom models."),
        ],
        "facts": [
            ("AWS announced at re:Invent 2025 that Bedrock has more than 100,000 customers, with over 50 of them each processing more than 1 trillion tokens.", "AWS official re:Invent 2025 recap, aboutamazon.com"),
            ("Rexera reports a 99% reduction in manual workload after migrating to Bedrock; Multitudes reports a 44% increase in monthly active users using Bedrock and Amazon Nova Pro.", "AWS's own published Bedrock customer case studies"),
        ],
        "resources": [
            ("Amazon Bedrock docs", "https://docs.aws.amazon.com/bedrock/"),
            ("AWS Certified AI Practitioner exam guide", "https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html"),
            ("Bedrock customer case studies", "https://aws.amazon.com/bedrock/customers/"),
            ("Amazon SageMaker docs", "https://docs.aws.amazon.com/sagemaker/"),
        ],
        "certification": "AWS Certified AI Practitioner (AIF-C01) — real, foundational, launched October 2024, currently active.",
    },
    "gcp-ai": {
        "tools": [
            ("Vertex AI", "GCP's unified ML/GenAI platform, with a Model Garden of 200+ models including the Gemini 2.5 family."),
            ("Vertex AI Agent Builder", "Includes the Agent Development Kit (ADK) and Agent Engine, now GA."),
        ],
        "facts": [
            ("TELUS built \"Fuel iX,\" an internal AI gateway on Vertex AI giving employees access to 40+ models through one secure interface.", "Google Cloud's own published customer case study"),
        ],
        "resources": [
            ("Vertex AI docs", "https://cloud.google.com/vertex-ai/docs"),
            ("Vertex AI Agent Builder overview", "https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview"),
            ("Google Cloud Generative AI Leader certification", "https://cloud.google.com/learn/certification/generative-ai-leader"),
            ("Google Cloud Professional ML Engineer certification", "https://cloud.google.com/learn/certification/machine-learning-engineer"),
            ("Google Cloud real-world GenAI case studies", "https://cloud.google.com/transform/101-real-world-generative-ai-use-cases-from-industry-leaders"),
        ],
        "certification": "Google Cloud Generative AI Leader (no-code, launched 2025) and Professional Machine Learning Engineer (technical) — both real and currently active.",
    },
}


def fetch_all(table, select="*", extra=""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select={select}{extra}", headers=HEADERS)
    r.raise_for_status()
    return r.json()


def _draw_chrome(canvas, doc, course):
    canvas.saveState()
    page_w, page_h = LETTER

    # Header band
    canvas.setFillColor(NAVY)
    canvas.rect(0, page_h - 0.55 * inch, page_w, 0.55 * inch, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(0.85 * inch, page_h - 0.37 * inch, "ROPES")
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(0.85 * inch + canvas.stringWidth("ROPES", "Helvetica-Bold", 12), page_h - 0.37 * inch, ".")
    canvas.setFillColor(colors.HexColor("#B9C2D4"))
    canvas.setFont("Helvetica", 8.5)
    title_short = course["title"] if len(course["title"]) < 48 else course["title"][:45] + "…"
    canvas.drawRightString(page_w - 0.85 * inch, page_h - 0.37 * inch, f"Course Playbook · {title_short}")

    # Footer
    canvas.setStrokeColor(INK_200)
    canvas.setLineWidth(0.6)
    canvas.line(0.85 * inch, 0.6 * inch, page_w - 0.85 * inch, 0.6 * inch)
    canvas.setFillColor(INK_600)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.85 * inch, 0.42 * inch, "ropes.buzz — Learn the ropes. Go independent.")
    canvas.drawRightString(page_w - 0.85 * inch, 0.42 * inch, f"Page {doc.page}")

    canvas.restoreState()


def build_pdf(course, modules, industry):
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=0.85 * inch, rightMargin=0.85 * inch,
        topMargin=1.15 * inch, bottomMargin=0.85 * inch,
        title=f"{course['title']} — Ropes Course Playbook",
        author="Ropes",
    )
    chrome = lambda c, d: _draw_chrome(c, d, course)
    story = []

    story.append(Paragraph("COURSE PLAYBOOK", kicker_style))
    story.append(Paragraph(esc(course["title"]), title_style))
    if course.get("description"):
        story.append(Paragraph(esc(course["description"]), tagline_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Track: {esc(course.get('track') or 'General')} &nbsp;&nbsp;|&nbsp;&nbsp; {len(modules)} modules &nbsp;&nbsp;|&nbsp;&nbsp; ropes.buzz",
        meta_style,
    ))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=14))
    story.append(Paragraph(
        "This playbook is the working reference for the track — use it alongside the module videos, "
        "not instead of them. Each week has a concrete build and a stated outcome so you always know "
        "what “done” looks like before moving on.",
        body_style,
    ))
    story.append(Spacer(1, 6))

    for i, m in enumerate(modules):
        story.append(HRFlowable(width="100%", thickness=0.6, color=INK_200, spaceBefore=10, spaceAfter=2))
        story.append(Paragraph(f"Week {i + 1}: {esc(m['title'])}", week_heading))

        topics = m.get("topics") or []
        if topics:
            story.append(Paragraph("WHAT YOU'LL COVER", label_style))
            for t in topics:
                story.append(Paragraph(f"&bull;&nbsp; {esc(t)}", bullet_style))

        if m.get("build_deliverable"):
            story.append(Paragraph("BUILD THIS WEEK", label_style))
            story.append(Paragraph(esc(m["build_deliverable"]), body_style))

        if m.get("outcome"):
            story.append(Paragraph("YOU'LL WALK AWAY ABLE TO", label_style))
            story.append(Paragraph(esc(m["outcome"]), body_style))

        if m.get("video_source_label"):
            story.append(Paragraph("REFERENCE VIDEO", label_style))
            story.append(Paragraph(
                f"{esc(m['video_source_label'])} — curated, external. Watch alongside this "
                f"checklist; the video teaches the how, this playbook keeps you honest about "
                f"what to actually finish before moving on.",
                note_style,
            ))

        story.append(Paragraph("SELF-CHECK BEFORE MOVING ON", label_style))
        for c in [
            "I can explain each topic above in my own words, not just recognize it.",
            "I finished the build/deliverable this week, not just watched the video.",
            "If stuck, I asked the AI mentor or booked a 1:1 session instead of skipping ahead.",
        ]:
            story.append(Paragraph(f"[&nbsp;&nbsp;]&nbsp; {c}", check_style))

        if i < len(modules) - 1:
            story.append(Spacer(1, 4))

    # --- How to monetize this track ---------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("COURSE PLAYBOOK", kicker_style))
    story.append(Paragraph("How to monetize this track", title_style))
    story.append(Paragraph(
        "A concrete, step-by-step path from finished capstone to your first paid client — "
        "framework and realistic ranges, not a promise. Actual results depend on your niche, "
        "effort, and existing network.",
        tagline_style,
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=14))

    scenario, tiers = EARNINGS_BY_TRACK.get(course.get("track"), DEFAULT_EARNINGS)
    channels = CLIENT_CHANNELS_BY_TRACK.get(course.get("track"), DEFAULT_CHANNELS)

    steps = [
        ("1. Package your capstone into an offer", (
            "Don't sell \"I took a course.\" Sell the specific thing you built in Week "
            f"{len(modules)} as a productized service — a named deliverable with a clear scope, "
            "timeline, and price. Clients buy outcomes, not curricula."
        )),
        ("2. Price using the tiers below, not guesswork", (
            f"This track's typical engagement is a {esc(scenario).lower()}. Start at the low end below "
            "for your first 1–2 clients to build proof, then move up as you have case studies to point to."
        )),
        ("3. Go find your first 3 clients", (
            "Don't wait for inbound. Work the channels below — realistically, expect to reach out "
            "to 20–30 prospects to land your first paid project."
        )),
        ("4. Deliver, then propose an ongoing retainer", (
            "Your first paid project is an audition for a recurring engagement. Before the project "
            "ends, propose a monthly retainer for maintenance, iteration, or the next phase."
        )),
        ("5. Use the AI mentor + 1:1 sessions to get unstuck fast", (
            "Every hour spent stuck on a technical blocker is an hour not spent finding clients. "
            "Ask the AI mentor first; book a 1:1 session for anything that needs a human review."
        )),
    ]

    for heading, body in steps:
        story.append(Paragraph(heading, label_style))
        story.append(Paragraph(body, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 6))
    story.append(Paragraph(f"ILLUSTRATIVE PRICING — {esc(scenario).upper()}", label_style))
    table_data = [["Stage", "Monthly", "Scope"]] + [
        [label, f"Rs. {amount:,}", note] for (label, amount, note) in tiers
    ]
    earnings_table = Table(table_data, colWidths=[1.6 * inch, 1.1 * inch, 3.15 * inch])
    earnings_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 1), (1, -1), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
        ("GRID", (0, 0), (-1, -1), 0.5, INK_200),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(earnings_table)
    story.append(Paragraph("Illustrative example — your results will vary.", note_style))
    story.append(Spacer(1, 12))

    story.append(Paragraph("WHERE TO FIND YOUR FIRST CLIENTS", label_style))
    for c in channels:
        story.append(Paragraph(f"&bull;&nbsp; {esc(c)}", bullet_style))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=12))
    story.append(Paragraph("AFTER YOU FINISH", label_style))
    for c in [
        "Bring your capstone build to a 1:1 session for a real review, not just self-assessment.",
        "Post your build in the community — the fastest way to get client-ready feedback.",
        "Still stuck on a concept? Ask the AI mentor with the week number — it has this playbook loaded.",
    ]:
        story.append(Paragraph(f"&bull;&nbsp; {c}", bullet_style))

    # --- Industry snapshot --------------------------------------------------
    if industry:
        story.append(PageBreak())
        story.append(Paragraph("COURSE PLAYBOOK", kicker_style))
        story.append(Paragraph("Industry snapshot", title_style))
        story.append(Paragraph(
            "Real, sourced research — current tools, market signal, and named case studies, each "
            "with a citation. Not marketing copy: anything the research couldn't trace to a named "
            "source was left out rather than estimated.",
            tagline_style,
        ))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.4, color=GOLD, spaceAfter=14))

        if industry.get("tools"):
            story.append(Paragraph("TOOLS YOU'LL ACTUALLY SEE IN THE FIELD", label_style))
            for name, desc in industry["tools"]:
                story.append(Paragraph(f"<b>{esc(name)}</b> — {esc(desc)}", bullet_style))
            story.append(Spacer(1, 8))

        if industry.get("facts"):
            story.append(Paragraph("MARKET SIGNAL", label_style))
            for detail, source in industry["facts"]:
                story.append(Paragraph(esc(detail), body_style))
                story.append(Paragraph(f"Source: {esc(source)}", note_style))
                story.append(Spacer(1, 5))

        if industry.get("resources"):
            story.append(Paragraph("GO DEEPER — FREE, OFFICIAL RESOURCES", label_style))
            for title, url in industry["resources"]:
                story.append(Paragraph(f"&bull;&nbsp; <b>{esc(title)}</b> — {esc(url)}", bullet_style))
            story.append(Spacer(1, 8))

        if industry.get("certification"):
            story.append(Paragraph("CERTIFICATION", label_style))
            story.append(Paragraph(esc(industry["certification"]), body_style))

    doc.build(story, onFirstPage=chrome, onLaterPages=chrome)
    buf.seek(0)
    return buf.read()


def main():
    courses = fetch_all("courses", "id,slug,title,description,track", "&order=title")
    for course in courses:
        modules = fetch_all(
            "modules",
            "id,title,topics,build_deliverable,outcome,video_source_label,order_index",
            f"&course_id=eq.{course['id']}&order=order_index.asc",
        )
        if not modules:
            print(f"SKIP {course['slug']} — no modules")
            continue

        industry = INDUSTRY_DATA.get(course["slug"])
        pdf_bytes = build_pdf(course, modules, industry)
        path = f"{course['id']}/playbook.pdf"

        up = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/course-content/{path}",
            headers={**HEADERS, "Content-Type": "application/pdf", "x-upsert": "true"},
            data=pdf_bytes,
        )
        if up.status_code not in (200, 201):
            print(f"FAILED upload {course['slug']}: {up.status_code} {up.text}")
            continue

        # remove the old .md object (best-effort)
        requests.delete(f"{SUPABASE_URL}/storage/v1/object/course-content/{course['id']}/playbook.md", headers=HEADERS)

        # point playbooks row at the new pdf
        requests.delete(f"{SUPABASE_URL}/rest/v1/playbooks?course_id=eq.{course['id']}", headers=HEADERS)
        ins = requests.post(
            f"{SUPABASE_URL}/rest/v1/playbooks",
            headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
            json={"course_id": course["id"], "file_url": path, "title": f"{course['title']} — Course Playbook"},
        )
        if ins.status_code not in (200, 201, 204):
            print(f"FAILED playbook row {course['slug']}: {ins.status_code} {ins.text}")
            continue

        print(f"OK   {course['slug']}  {len(pdf_bytes)} bytes  {len(modules)} modules")


if __name__ == "__main__":
    main()
