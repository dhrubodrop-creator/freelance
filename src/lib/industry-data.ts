// Real, sourced industry context per course — tools, market signal, and
// external resources gathered from primary sources (vendor docs, official
// press releases, Stanford HAI, BLS, LinkedIn, Indeed Hiring Lab, etc.) as of
// August 2026. Every `facts` entry carries a `source` because these are
// presented to learners as verified information, not marketing copy. Where
// research turned up no citable number, that data point is simply omitted
// rather than estimated — see DECISIONS.md for the research pass this was
// built from.

export interface IndustryTool {
  name: string;
  description: string;
}

export interface IndustryFact {
  detail: string;
  source: string;
}

export interface IndustryResource {
  title: string;
  url: string;
  description: string;
}

export interface CourseIndustryData {
  tools: IndustryTool[];
  facts: IndustryFact[];
  resources: IndustryResource[];
  certification: string;
}

export const INDUSTRY_DATA: Record<string, CourseIndustryData> = {
  "agentic-ai": {
    tools: [
      { name: "LangGraph", description: "Graph-based orchestration for stateful, long-running agents; reached v1.0 in late 2025." },
      { name: "CrewAI", description: "Role-based multi-agent framework built for fast prototyping." },
      { name: "OpenAI Agents SDK", description: "OpenAI's code-first framework for agents, handoffs, and guardrails." },
      { name: "Claude Agent SDK", description: "Anthropic's SDK for building custom agents on Claude Code's infrastructure." },
      { name: "Model Context Protocol (MCP)", description: "Open standard (Anthropic, now Linux Foundation) that most agent frameworks use to connect to tools." },
    ],
    facts: [
      { detail: "Searches for AI-agent implementation expertise on Fiverr surged 18,347% over six months.", source: "Fiverr Spring 2025 Business Trends Index" },
      { detail: "Demand for AI-tied freelance skills on Upwork grew 109% year-over-year in 2025.", source: "Upwork 2026 In-Demand Skills report" },
      { detail: "AI agents' success rate on real-world computer tasks rose from about 12% to 66% in roughly 18 months.", source: "Stanford HAI data, reported by Forbes, April 2026" },
    ],
    resources: [
      { title: "ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", description: "The foundational paper behind the agent reasoning-and-acting loop." },
      { title: "Toolformer", url: "https://arxiv.org/abs/2302.04761", description: "How language models learn to use external tools." },
      { title: "Model Context Protocol docs", url: "https://modelcontextprotocol.io/docs/getting-started/intro", description: "The open standard for connecting agents to tools and data." },
      { title: "Anthropic Engineering blog", url: "https://www.anthropic.com/engineering", description: "Production agent-design patterns from Anthropic's own teams." },
      { title: "Introduction to MCP (free course)", url: "https://anthropic.skilljar.com/introduction-to-model-context-protocol", description: "Anthropic's free, certificate-eligible MCP course." },
    ],
    certification: "No independently accredited \"agentic AI\" certification exists yet. LangChain Academy and Anthropic Academy both issue free, LinkedIn-shareable course-completion certificates.",
  },
  "agentic-ai-development-with-langchain-langgraph": {
    tools: [
      { name: "LangGraph", description: "Low-level graph orchestration for stateful agents; used in production by Klarna, Uber, and J.P. Morgan." },
      { name: "LangChain", description: "The broader framework LangGraph extends — chains, memory, and tool integrations." },
      { name: "CrewAI", description: "A faster-to-prototype alternative worth knowing for comparison." },
      { name: "Model Context Protocol (MCP)", description: "The tool-connection standard LangGraph agents increasingly rely on." },
    ],
    facts: [
      { detail: "LangGraph is used in production by Klarna, Uber, and J.P. Morgan.", source: "LangChain's official langchain.com/langgraph page" },
      { detail: "Demand for AI-tied freelance skills on Upwork grew 109% year-over-year in 2025.", source: "Upwork 2026 In-Demand Skills report" },
    ],
    resources: [
      { title: "LangGraph official docs", url: "https://docs.langchain.com/oss/python/langgraph/overview", description: "The canonical reference for building with LangGraph." },
      { title: "LangChain Academy (free, certificate-eligible)", url: "https://academy.langchain.com/", description: "LangChain's own structured, free training." },
      { title: "LangChain Academy GitHub", url: "https://github.com/langchain-ai/langchain-academy", description: "Code and notebooks for the Academy courses." },
      { title: "LangGraph GitHub", url: "https://github.com/langchain-ai/langgraph", description: "Source code and issue tracker." },
      { title: "AI Agents in LangGraph (DeepLearning.AI)", url: "https://www.deeplearning.ai/courses/ai-agents-in-langgraph", description: "Taught by LangChain's founder and Tavily's founder." },
    ],
    certification: "No independently accredited \"LangGraph\" certification exists yet. LangChain Academy issues free, LinkedIn-shareable completion certificates for its courses.",
  },
  "claude-code-ai": {
    tools: [
      { name: "Claude Code", description: "Anthropic's agentic terminal coding tool — multi-file changes, git workflows, and CI integration." },
      { name: "Claude Agent SDK", description: "Build custom coding/ops agents on the same infrastructure as Claude Code." },
      { name: "GitHub Copilot", description: "The longest-established AI pair programmer; added Agent Mode in 2025." },
      { name: "Cursor", description: "An AI-native code editor built as a VS Code fork." },
      { name: "Model Context Protocol (MCP)", description: "The extensibility layer Claude Code uses to connect to external tools." },
    ],
    facts: [
      { detail: "Claude Code reached $1 billion in run-rate revenue in November 2025 — six months after general availability, and Anthropic's fastest-growing enterprise product ever.", source: "Anthropic official announcement, November 2025" },
      { detail: "Anthropic names Netflix, Spotify, KPMG, L'Oréal, and Salesforce directly as Claude Code enterprise customers; enterprise use is over half of Claude Code's revenue.", source: "Anthropic official announcement" },
      { detail: "Coding is the largest category of enterprise AI spend — $4.0 billion, 55% of departmental AI budgets — and Anthropic's enterprise LLM API market share tripled to 40% in 2025.", source: "Menlo Ventures, \"2025 State of Generative AI in the Enterprise\", December 2025" },
    ],
    resources: [
      { title: "Claude Code official docs", url: "https://code.claude.com/docs/en/quickstart", description: "Setup, workflows, and CLI reference." },
      { title: "Claude Code GitHub repo", url: "https://github.com/anthropics/claude-code", description: "Source, issues, and community usage patterns." },
      { title: "Claude Code in Action (free course)", url: "https://anthropic.skilljar.com/claude-code-in-action", description: "Anthropic Academy's free course with a completion certificate." },
      { title: "Claude prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", description: "Official prompt-engineering guidance." },
      { title: "Interactive prompt engineering tutorial", url: "https://github.com/anthropics/prompt-eng-interactive-tutorial", description: "Anthropic's free, hands-on GitHub tutorial." },
    ],
    certification: "Anthropic runs a real certification pathway — Claude Certified Associate, Developer, and Architect — delivered through Pearson VUE, with free prep courses on Anthropic Academy.",
  },
  "ai-stack": {
    tools: [
      { name: "LangChain", description: "General-purpose framework for chains, agents, and memory." },
      { name: "LlamaIndex", description: "Framework specialized for data ingestion and RAG pipelines." },
      { name: "Pinecone", description: "Managed vector database for RAG retrieval, with an official LlamaIndex integration." },
      { name: "Hugging Face", description: "Model hub and libraries underpinning most open-source AI stacks." },
      { name: "Model Context Protocol (MCP)", description: "The interoperability layer connecting these pieces to external tools." },
    ],
    facts: [
      { detail: "LinkedIn's 2025 \"Jobs on the Rise\" report ranked AI Engineer the #1 fastest-growing job title in the US.", source: "LinkedIn 2025 Jobs on the Rise report" },
      { detail: "The share of US job postings mentioning AI reached 4.2% by the end of 2025, and GenAI could highly transform 26% of jobs posted in the prior year.", source: "Indeed Hiring Lab, January 2026" },
      { detail: "Enterprise GenAI spend grew from roughly $1.7 billion in 2023 to $37 billion in 2025 — a scale-up that took SaaS 15+ years to reach.", source: "Menlo Ventures, December 2025" },
    ],
    resources: [
      { title: "LangChain docs", url: "https://docs.langchain.com", description: "Framework reference and guides." },
      { title: "LlamaIndex docs", url: "https://docs.llamaindex.ai", description: "RAG-focused framework documentation." },
      { title: "Hugging Face Learn", url: "https://huggingface.co/learn", description: "Free courses across the Hugging Face ecosystem." },
      { title: "OpenAI Cookbook", url: "https://cookbook.openai.com", description: "Official, widely-used examples repo (70k+ GitHub stars)." },
      { title: "Model Context Protocol docs", url: "https://modelcontextprotocol.io/docs/getting-started/intro", description: "The tool-connection standard used across the stack." },
    ],
    certification: "No formal \"AI stack\" certification exists. The closest real credentials are Anthropic's Claude certifications and the cloud providers' GenAI certifications (see the Cloud AI courses).",
  },
  "ai-engineering-for-forward-deployed-engineer": {
    tools: [
      { name: "Claude Agent SDK", description: "For building embedded, client-facing agent tooling." },
      { name: "Google Agent Development Kit (ADK)", description: "Enterprise multi-agent deployment toolkit." },
      { name: "LangGraph", description: "Production orchestration for the systems FDEs typically ship." },
      { name: "Model Context Protocol (MCP)", description: "The core skill for wiring an agent into a client's existing systems." },
    ],
    facts: [
      { detail: "OpenAI, Anthropic, Google Cloud, Palantir, Salesforce, Databricks, Adobe, and Scale AI all now hire Forward Deployed Engineer-style roles.", source: "MarkTechPost, May 2026" },
      { detail: "Palantir originated the Forward Deployed Engineer role — embedding engineers directly with clients to ship production software.", source: "Widely documented; Palantir's own careers pages" },
      { detail: "Industry compensation trackers report mid-to-senior FDE packages commonly in the $220,000–$550,000 range at OpenAI, Anthropic, and Palantir.", source: "Market-reported by industry compensation trackers, not an audited primary source — treat as directional" },
    ],
    resources: [
      { title: "Anthropic Engineering blog", url: "https://www.anthropic.com/engineering", description: "Real production agent-deployment patterns." },
      { title: "Google ADK docs", url: "https://google.github.io/adk-docs/", description: "Enterprise multi-agent deployment patterns." },
      { title: "LangGraph production/deployment docs", url: "https://docs.langchain.com/oss/python/langgraph/overview", description: "Taking agent systems from prototype to production." },
      { title: "Model Context Protocol docs", url: "https://modelcontextprotocol.io/docs/getting-started/intro", description: "The core integration skill for client-embedded engineering." },
    ],
    certification: "No formal \"Forward Deployed Engineer\" certification exists — it's a role pattern, not a credential. Anthropic's Claude certification pathway is the closest concretely relevant credential.",
  },
  "generative-ai-genai": {
    tools: [
      { name: "OpenAI / Anthropic APIs", description: "The two leading foundation-model providers most GenAI products build on." },
      { name: "Prompt engineering techniques", description: "Structured prompting, few-shot examples, and evaluation loops." },
      { name: "Hugging Face", description: "Open-source models and libraries for GenAI development." },
      { name: "LangChain", description: "Framework for chaining prompts, memory, and tools into applications." },
    ],
    facts: [
      { detail: "Enterprise generative AI usage rose from 33% to 71% of organizations between 2023 and 2024; overall AI adoption rose from 55% to 78%.", source: "Stanford HAI 2025 AI Index Report" },
      { detail: "Generative AI attracted $33.9 billion in global private investment in 2024, up 18.7% from 2023.", source: "Stanford HAI 2025 AI Index Report" },
    ],
    resources: [
      { title: "Generative AI for Everyone (Andrew Ng, free)", url: "https://www.coursera.org/learn/generative-ai-for-everyone", description: "A free, non-technical foundation from DeepLearning.AI." },
      { title: "DeepLearning.AI course catalog", url: "https://www.deeplearning.ai/courses", description: "Many free short courses on GenAI techniques." },
      { title: "OpenAI Cookbook", url: "https://cookbook.openai.com", description: "Official, practical GenAI examples." },
      { title: "Anthropic prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", description: "Official guidance on getting reliable outputs." },
      { title: "Prompting Guide", url: "https://www.promptingguide.ai", description: "Widely-used free reference covering prompting techniques across models." },
    ],
    certification: "Google Cloud's Generative AI Leader certification (no-code, launched 2025) and AWS's Certified AI Practitioner are both real, active, foundational credentials.",
  },
  "ai-agents-with-n8n-no-code": {
    tools: [
      { name: "n8n", description: "Open-source, self-hostable workflow automation platform with ~70 AI/agent nodes as of its 2026 release." },
      { name: "Zapier Agents", description: "8,000+ app integrations with autonomous multi-app task execution." },
      { name: "Make.com", description: "Visual scenario builder with an AI assistant that drafts automations from plain language." },
      { name: "LangChain", description: "The framework n8n's AI nodes are built on under the hood." },
    ],
    facts: [
      { detail: "n8n raised a $180M Series C in October 2025 at a $2.5B valuation, reaching $40M ARR with 230,000+ active users and 3,000+ enterprise customers including Vodafone, Delivery Hero, and Microsoft.", source: "TechFundingNews / Sacra, October 2025" },
      { detail: "Vodafone reports £2.2M in operational cost savings from n8n-based security threat-intelligence automation; Delivery Hero saves 200 hours a month via a single workflow; Field Aerospace cut proposal generation from two weeks to 25 minutes.", source: "n8n's own published customer case studies, n8n.io/case-studies" },
    ],
    resources: [
      { title: "n8n docs", url: "https://docs.n8n.io", description: "Official platform documentation." },
      { title: "n8n Academy (free courses + certification)", url: "https://learn.n8n.io", description: "Includes a free Level 1 Beginner Certification." },
      { title: "n8n community forum", url: "https://community.n8n.io", description: "Active official user community." },
      { title: "n8n workflow template library", url: "https://n8n.io/workflows", description: "Pre-built workflows to learn from and adapt." },
      { title: "n8n case studies", url: "https://n8n.io/case-studies", description: "30+ published, named-company results." },
    ],
    certification: "n8n's own free Level 1 Beginner Certification, issued through n8n Academy, is real and currently available.",
  },
  "ai-agents-for-devops-engineers": {
    tools: [
      { name: "GitHub Copilot (Workspace, Autofix)", description: "Extended into full issue-to-PR workflows and automated vulnerability fixes." },
      { name: "Datadog Bits AI", description: "Generative-AIOps assistant for alert investigation and root-cause analysis." },
      { name: "PagerDuty AIOps", description: "ML-based alert correlation and incident-response automation." },
      { name: "incident.io", description: "AI-assisted incident response and on-call workflow platform." },
    ],
    facts: [
      { detail: "Google's SRE book and workbook remain the canonical, free reference for the operational practices these AI copilots layer on top of.", source: "sre.google (Google's official SRE publication)" },
    ],
    resources: [
      { title: "Site Reliability Engineering (free book)", url: "https://sre.google", description: "Google's canonical, official SRE reference." },
      { title: "GitHub Copilot docs", url: "https://docs.github.com/copilot", description: "Official Copilot documentation, including Agent Mode." },
      { title: "awesome-ai-sre (curated list)", url: "https://github.com/agamm/awesome-ai-sre", description: "100+ actively maintained AI-SRE/AIOps tools and resources." },
      { title: "Datadog docs", url: "https://docs.datadoghq.com", description: "Official documentation for Bits AI and Watchdog." },
      { title: "PagerDuty developer docs", url: "https://developer.pagerduty.com", description: "Official incident-automation documentation." },
    ],
    certification: "No AI-agent-specific DevOps certification exists yet. Standard cloud DevOps certifications (e.g. AWS DevOps Engineer Professional) remain the credentialed baseline.",
  },
  "mlops-machine-learning-operations": {
    tools: [
      { name: "MLflow", description: "Open-source experiment tracking, model registry, and deployment." },
      { name: "Weights & Biases", description: "Managed experiment tracking and collaboration, with a strong free tier." },
      { name: "Kubeflow", description: "Kubernetes-native ML pipeline orchestration and model serving." },
      { name: "DVC", description: "Open-source data and model version control, commonly paired with MLflow." },
    ],
    facts: [
      { detail: "Uber's Michelangelo platform, built from around 2015, is one of the best-documented production MLOps systems — running thousands of models in production across fraud detection, ETA prediction, and marketplace forecasting.", source: "Widely documented industry case study" },
      { detail: "The global MLOps market is estimated at $3.3–$4.4 billion in 2026 by different research firms, projected to reach $57–$90 billion by 2034–2035.", source: "Precedence Research and Fortune Business Insights (estimates vary by methodology)" },
    ],
    resources: [
      { title: "MLflow docs", url: "https://mlflow.org/docs/latest/index.html", description: "Official documentation for the leading open-source MLOps toolkit." },
      { title: "Weights & Biases docs", url: "https://docs.wandb.ai", description: "Official documentation." },
      { title: "Kubeflow docs", url: "https://www.kubeflow.org/docs/", description: "Official Kubernetes-native ML pipeline documentation." },
      { title: "DVC docs", url: "https://dvc.org/doc", description: "Official data/model versioning documentation." },
      { title: "ml-ops.org", url: "https://ml-ops.org", description: "Widely-referenced open community reference on MLOps principles." },
    ],
    certification: "Real, currently active credentials: AWS Certified Machine Learning Engineer – Associate ($150), Google Cloud Professional Machine Learning Engineer ($200), and Microsoft Azure Data Scientist Associate ($165).",
  },
  aiops: {
    tools: [
      { name: "Datadog (Watchdog, Bits AI)", description: "Unified observability with automated anomaly detection." },
      { name: "Dynatrace (Davis AI)", description: "AI engine for automated incident resolution, strong in hybrid/on-prem." },
      { name: "PagerDuty", description: "Alert correlation and on-call workflow automation." },
      { name: "Moogsoft / BigPanda", description: "Purpose-built event-correlation and noise-reduction platforms." },
    ],
    facts: [
      { detail: "AIOps market-size estimates vary widely by research firm — from roughly $2.7B to $19B for 2026 depending on how the market is defined, with the platform segment projected to reach $32.4B by 2028 from $11.7B in 2023.", source: "MarketsandMarkets, Fortune Business Insights, Mordor Intelligence (ranges vary by methodology)" },
    ],
    resources: [
      { title: "awesome-ai-sre (curated list)", url: "https://github.com/agamm/awesome-ai-sre", description: "100+ actively maintained AIOps/AI-SRE tools and resources." },
      { title: "Google SRE resource library", url: "https://sre.google/resources/", description: "Official, free operational reference." },
      { title: "Datadog docs", url: "https://docs.datadoghq.com", description: "Official documentation for Watchdog and AIOps features." },
      { title: "Dynatrace docs", url: "https://www.dynatrace.com/support/help/", description: "Official documentation for Davis AI." },
      { title: "PagerDuty docs", url: "https://support.pagerduty.com", description: "Official incident-management documentation." },
    ],
    certification: "No dedicated, widely-recognized AIOps certification exists yet from a major vendor or standards body.",
  },
  llmops: {
    tools: [
      { name: "LangSmith", description: "LangChain's hosted LLM tracing, evaluation, and observability platform." },
      { name: "Langfuse", description: "Open-source LLM observability, tracing, and prompt management." },
      { name: "Arize / Phoenix", description: "LLM observability and evaluation, including an open-source option." },
      { name: "W&B Weave", description: "Weights & Biases' LLM-specific observability and evaluation layer." },
    ],
    facts: [
      { detail: "The LLMOps software market is projected to grow from $5.88B (2025) to $7.14B (2026), reaching $15.59B by 2030.", source: "Research and Markets" },
      { detail: "Wordsmith, a legal AI company, used LangSmith to compare models and shipped a Claude 3.5 upgrade to production the same day it released — cutting cost on suitable tasks up to 10x.", source: "LangChain's official customer blog, langchain.com/blog/customers-wordsmith" },
      { detail: "SumUp runs Langfuse across 4M+ merchants for AI-powered first-level support.", source: "Langfuse's own customer page, langfuse.com/users/sumup" },
    ],
    resources: [
      { title: "LangSmith docs", url: "https://docs.smith.langchain.com", description: "Official documentation." },
      { title: "Langfuse docs", url: "https://langfuse.com/docs", description: "Official, open-source LLM observability documentation." },
      { title: "Langfuse GitHub", url: "https://github.com/langfuse/langfuse", description: "Open-source repository." },
      { title: "Arize / Phoenix docs", url: "https://docs.arize.com/phoenix", description: "Official evaluation and observability documentation." },
      { title: "MLflow LLMs & Agents docs", url: "https://mlflow.org/docs/latest/index.html", description: "MLflow's newer LLM-specific tooling." },
    ],
    certification: "No dedicated, currently-valid LLMOps certification exists yet from a recognized vendor or standards body.",
  },
  "ai-product-management": {
    tools: [
      { name: "Amplitude", description: "Enterprise product analytics with predictive/behavioral cohorting." },
      { name: "PostHog", description: "Open-source, all-in-one analytics, session replay, and A/B testing." },
      { name: "Braintrust", description: "Eval-first platform for testing whether a prompt or model change actually improved output quality." },
      { name: "LangSmith", description: "Trace-first LLM observability, useful for debugging production AI features." },
    ],
    facts: [
      { detail: "LinkedIn's 2026 \"Jobs on the Rise\" report ranks AI Engineer #1 and AI Consultant/Strategist #2 among the fastest-growing US roles; Product Manager is a documented top feeder role into both.", source: "LinkedIn's official 2026 Jobs on the Rise report" },
      { detail: "Netflix posted a fully-remote Generative AI Product Manager role in September 2025 with a published salary range of $240,000–$700,000 a year.", source: "Fortune, October 2025" },
      { detail: "Reforge's AI Product Management curriculum teaches writing AI-specific PRDs that cover embeddings, retrieval tradeoffs, and post-launch evaluation loops.", source: "reforge.com/course-categories/ai" },
    ],
    resources: [
      { title: "Reforge — AI Product Management", url: "https://www.reforge.com/course-categories/ai", description: "Practitioner-built curriculum on AI PRDs and product leadership." },
      { title: "Mind the Product", url: "https://www.mindtheproduct.com/", description: "Long-running, free PM publication with recurring AI-PM coverage." },
      { title: "Product School AI PM Certification", url: "https://productschool.com/certifications/ai-for-product-managers", description: "A real, active paid certification." },
      { title: "AIPMM certification body", url: "https://aipmm.com/certification", description: "Association of International Product Marketing & Management." },
      { title: "Stanford HAI AI Index Report", url: "https://hai.stanford.edu/ai-index", description: "Annual, free primary source for AI labor-market data." },
    ],
    certification: "Real, active credentials: AIPMM's CPM/CPMM/CBM certifications and Product School's AI Product Management Certification ($2,999).",
  },
  "data-science-ai-ml": {
    tools: [
      { name: "pandas / NumPy", description: "Core Python data manipulation — still foundational in 2026 curricula." },
      { name: "scikit-learn", description: "Still the default for most enterprise classification and regression tasks." },
      { name: "PyTorch", description: "The de facto standard for model training." },
      { name: "Hugging Face Transformers", description: "500,000+ pretrained models; the standard entry point for applied NLP." },
    ],
    facts: [
      { detail: "The median annual wage for Data Scientists was $112,590 (May 2024), with 34% projected employment growth from 2024 to 2034 — much faster than average — and about 23,400 average annual openings.", source: "US Bureau of Labor Statistics, Occupational Outlook Handbook" },
      { detail: "Python remains the single most in-demand specialized AI skill, appearing in 258,674 job postings — up 391% versus its 2013–15 baseline.", source: "Stanford HAI 2025 AI Index Report" },
    ],
    resources: [
      { title: "scikit-learn User Guide", url: "https://scikit-learn.org/stable/user_guide.html", description: "Official, canonical reference." },
      { title: "PyTorch tutorials", url: "https://pytorch.org/tutorials/", description: "Official tutorials for the standard training framework." },
      { title: "Kaggle Learn", url: "https://www.kaggle.com/learn", description: "Free micro-courses in Python, pandas, and ML." },
      { title: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course", description: "A free, ~15-hour interactive course." },
      { title: "fast.ai — Practical Deep Learning for Coders", url: "https://course.fast.ai/", description: "Jeremy Howard's free, top-down deep learning course." },
    ],
    certification: "Real, active credentials: the Google Advanced Data Analytics Professional Certificate, AWS Certified Machine Learning Engineer – Associate, and AWS Certified Machine Learning – Specialty.",
  },
  "data-science-with-generative-ai": {
    tools: [
      { name: "LangGraph / LlamaIndex", description: "Agentic workflow orchestration and RAG-specific data pipelines." },
      { name: "Hugging Face", description: "Open-source models and libraries for GenAI-augmented data science." },
      { name: "dbt", description: "Standard tool for SQL-based data transformation pipelines." },
      { name: "scikit-learn / PyTorch", description: "The base ML stack GenAI workflows sit on top of." },
    ],
    facts: [
      { detail: "Instacart's own engineering team documents using GitHub Copilot, OpenAI models, and an internal \"LLM-Assisted Chatbot Evaluation\" framework across its data science organization.", source: "Instacart's official company blog" },
      { detail: "GitHub's own Duolingo case study reports a 25% developer-speed increase for engineers new to a codebase (10% for experienced engineers) after Copilot integration.", source: "GitHub official customer case study" },
      { detail: "\"Agentic AI\" skill-cluster job postings grew more than 280% in one year, to roughly 90,000 US postings.", source: "Stanford HAI 2025 AI Index Report" },
    ],
    resources: [
      { title: "Hugging Face NLP Course", url: "https://huggingface.co/learn", description: "Free, official course covering Transformers and RAG-adjacent workflows." },
      { title: "LangChain / LangGraph docs", url: "https://python.langchain.com/", description: "Canonical reference for RAG and agent-workflow orchestration." },
      { title: "arXiv.org", url: "https://arxiv.org", description: "Primary source for current RAG and LLM research." },
      { title: "dbt docs", url: "https://docs.getdbt.com/", description: "Official documentation for the data-transformation layer." },
      { title: "Instacart Engineering Blog", url: "https://company.instacart.com/updates/how-generative-ai-is-revolutionizing-data-science", description: "A real, applied case study directly usable as course reading." },
    ],
    certification: "Real, active credentials: the Google Advanced Data Analytics Professional Certificate and AWS's Machine Learning certifications (see Data Science (AI & ML)).",
  },
  "ai-security": {
    tools: [
      { name: "OWASP Top 10 for LLM Applications", description: "Community-ranked list of top LLM app risks; prompt injection has ranked #1 for two consecutive editions." },
      { name: "NVIDIA garak", description: "Open-source LLM vulnerability scanner covering prompt injection, jailbreaks, and data leakage." },
      { name: "Microsoft PyRIT", description: "Open-source, model-agnostic red-teaming automation framework." },
      { name: "MITRE ATLAS", description: "An ATT&CK-style knowledge base of adversary techniques specific to AI systems." },
    ],
    facts: [
      { detail: "41% of security professionals cite AI as a critical skill gap on their team — the top-cited gap for the second year running, ahead of cloud security at 36%.", source: "(ISC)² 2025 Cybersecurity Workforce Study" },
      { detail: "61% of security professionals cite generative AI/LLMs as the leading tech priority for 2026; 59% cite AI-driven social engineering as the most significant threat organizations face.", source: "ISACA 2025 State of Cybersecurity survey" },
      { detail: "Microsoft 365 Copilot's \"EchoLeak\" zero-click prompt-injection flaw (CVSS 9.3) let attackers exfiltrate sensitive documents via a crafted email — disclosed June 2025.", source: "Widely reported security disclosure" },
      { detail: "A Canadian tribunal held Air Canada liable in February 2024 after its website chatbot gave a customer incorrect fare-policy information.", source: "CBC News / Forbes, February 2024" },
    ],
    resources: [
      { title: "OWASP Top 10 for LLM Applications (2025)", url: "https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/", description: "The community-standard risk reference." },
      { title: "NIST AI Risk Management Framework, Generative AI Profile", url: "https://www.nist.gov/itl/ai-risk-management-framework", description: "Official US government AI risk guidance." },
      { title: "MITRE ATLAS", url: "https://atlas.mitre.org", description: "Real-world adversarial AI technique knowledge base." },
      { title: "Microsoft PyRIT", url: "https://github.com/Azure/PyRIT", description: "Official open-source red-teaming framework." },
      { title: "NVIDIA garak", url: "https://github.com/NVIDIA/garak", description: "Official open-source LLM vulnerability scanner." },
    ],
    certification: "ISACA's AAISM (launched August 2025, requires CISM or CISSP) and new SANS/GIAC AI security certifications (GAIPS, GASAE) are real and current. ISC²'s dedicated AI Security certification is still in development, with a pilot exam expected in late 2026 — don't expect it available yet.",
  },
  "ai-llm-testing": {
    tools: [
      { name: "Promptfoo", description: "Open-source LLM red-teaming and testing tool covering 50+ vulnerability classes, CI/CD-ready." },
      { name: "NVIDIA garak", description: "Open-source vulnerability scanner for prompt injection, jailbreaks, and hallucination." },
      { name: "Microsoft PyRIT", description: "Automated, multi-turn red-teaming framework." },
      { name: "OWASP GenAI Security Project", description: "The broader project hub behind the OWASP LLM Top 10." },
    ],
    facts: [
      { detail: "41% of security professionals cite AI as a critical skill gap on their team.", source: "(ISC)² 2025 Cybersecurity Workforce Study" },
      { detail: "Prompt injection has ranked #1 on the OWASP Top 10 for LLM Applications for two consecutive editions.", source: "OWASP GenAI Security Project" },
    ],
    resources: [
      { title: "Promptfoo red-team docs", url: "https://www.promptfoo.dev/docs/red-team/", description: "Official documentation for LLM red-teaming." },
      { title: "NVIDIA garak", url: "https://github.com/NVIDIA/garak", description: "Official open-source vulnerability scanner." },
      { title: "Microsoft PyRIT docs", url: "https://microsoft.github.io/PyRIT/", description: "Official red-teaming automation documentation." },
      { title: "OWASP GenAI Security Project", url: "https://genai.owasp.org/", description: "Project hub for LLM application security testing guidance." },
      { title: "MITRE ATLAS case studies", url: "https://atlas.mitre.org", description: "Real documented attack techniques to test against." },
    ],
    certification: "Same real, current pathway as AI Security: ISACA's AAISM and SANS/GIAC's new AI security certifications (GAIPS, GASAE).",
  },
  "azure-ai": {
    tools: [
      { name: "Microsoft Foundry", description: "Renamed from \"Azure AI Foundry\" at Microsoft Ignite, November 18, 2025 — the unified environment for building AI apps and agents." },
      { name: "Azure AI Services", description: "Rebranded from \"Azure AI Foundry Tools\"; pre-built AI capabilities (vision, language, speech)." },
      { name: "Azure OpenAI", description: "Microsoft's managed access to OpenAI's models on Azure infrastructure." },
    ],
    facts: [
      { detail: "Microsoft renamed \"Azure AI Foundry\" to \"Microsoft Foundry\" at Ignite on November 18, 2025 — course material should use the current name.", source: "InfoWorld / Directions on Microsoft, November 2025" },
      { detail: "The \"Azure AI Engineer Associate\" (AI-102) certification was retired on June 30, 2026. Its replacement, AI-103, leads to the \"Azure AI Apps and Agents Developer Associate\" credential and shifts focus toward building GenAI apps and agents.", source: "Microsoft Learn's official certification page (fetched directly)" },
    ],
    resources: [
      { title: "Microsoft Foundry docs", url: "https://learn.microsoft.com/en-us/azure/ai-foundry/", description: "Official documentation for the renamed platform." },
      { title: "Azure AI Services documentation hub", url: "https://learn.microsoft.com/en-us/azure/ai-services/", description: "Official service-by-service reference." },
      { title: "Microsoft Learn AI certifications catalog", url: "https://learn.microsoft.com/en-us/credentials/browse/?products=azure&subjects=artificial-intelligence", description: "Current, correct certification paths, including AI-103." },
      { title: "Azure OpenAI docs", url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/", description: "Official documentation." },
    ],
    certification: "AI-102 (\"Azure AI Engineer Associate\") was retired June 30, 2026. The current path is AI-103, leading to \"Azure AI Apps and Agents Developer Associate.\"",
  },
  "aws-ai": {
    tools: [
      { name: "Amazon Bedrock", description: "AWS's managed foundation-model service — 100,000+ customers as of re:Invent 2025." },
      { name: "Amazon SageMaker", description: "AWS's platform for building, training, and deploying custom models." },
    ],
    facts: [
      { detail: "AWS announced at re:Invent 2025 that Bedrock has more than 100,000 customers, with over 50 of them each processing more than 1 trillion tokens.", source: "AWS official re:Invent 2025 recap, aboutamazon.com" },
      { detail: "Rexera reports a 99% reduction in manual workload after migrating to Bedrock; Multitudes reports a 44% increase in monthly active users using Bedrock and Amazon Nova Pro.", source: "AWS's own published Bedrock customer case studies" },
    ],
    resources: [
      { title: "Amazon Bedrock docs", url: "https://docs.aws.amazon.com/bedrock/", description: "Official documentation." },
      { title: "AWS Certified AI Practitioner exam guide", url: "https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html", description: "Official exam guide for AIF-C01." },
      { title: "Bedrock customer case studies", url: "https://aws.amazon.com/bedrock/customers/", description: "Real, named-company results published by AWS." },
      { title: "Amazon SageMaker docs", url: "https://docs.aws.amazon.com/sagemaker/", description: "Official documentation." },
    ],
    certification: "AWS Certified AI Practitioner (AIF-C01) — real, foundational, launched October 2024, currently active.",
  },
  "gcp-ai": {
    tools: [
      { name: "Vertex AI", description: "GCP's unified ML/GenAI platform, with a Model Garden of 200+ models including the Gemini 2.5 family." },
      { name: "Vertex AI Agent Builder", description: "Includes the Agent Development Kit (ADK) and Agent Engine, now GA." },
    ],
    facts: [
      { detail: "TELUS built \"Fuel iX,\" an internal AI gateway on Vertex AI giving employees access to 40+ models through one secure interface.", source: "Google Cloud's own published customer case study" },
    ],
    resources: [
      { title: "Vertex AI docs", url: "https://cloud.google.com/vertex-ai/docs", description: "Official documentation." },
      { title: "Vertex AI Agent Builder overview", url: "https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview", description: "Official documentation for GCP's agent platform." },
      { title: "Google Cloud Generative AI Leader certification", url: "https://cloud.google.com/learn/certification/generative-ai-leader", description: "A real, no-code-required certification." },
      { title: "Google Cloud Professional ML Engineer certification", url: "https://cloud.google.com/learn/certification/machine-learning-engineer", description: "A real, technical certification." },
      { title: "Google Cloud real-world GenAI case studies", url: "https://cloud.google.com/transform/101-real-world-generative-ai-use-cases-from-industry-leaders", description: "Published, named-company examples." },
    ],
    certification: "Google Cloud Generative AI Leader (no-code, launched 2025) and Professional Machine Learning Engineer (technical) — both real and currently active.",
  },
};

export function getIndustryData(slug: string): CourseIndustryData | null {
  return INDUSTRY_DATA[slug] ?? null;
}
