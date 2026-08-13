const TRACK_CONTEXT: Record<string, { audience: string; capability: string; application: string }> = {
  "No-Code Automation": { audience: "Operations, sales, marketing, consulting, and other process-focused professionals—including non-programmers.", capability: "Design and hand over reliable AI-assisted workflows with appropriate approvals and error handling.", application: "Workflow implementation, internal operations, service-business automation, or a no-code consulting capability." },
  "Agentic Systems": { audience: "Professionals and developers who need multi-step, tool-using AI systems rather than simple chat interfaces.", capability: "Scope, design, evaluate, and govern agents that use tools, memory, state, and human oversight.", application: "Research, knowledge, operations, support, or specialised agent implementation." },
  "AI Engineering": { audience: "Developers, data practitioners, technical consultants, and builders moving from prototypes to usable AI applications.", capability: "Build, ground, package, deploy, and evaluate AI applications across the modern engineering stack.", application: "AI application delivery, technical consulting, product engineering, or forward-deployed work." },
  "AI Operations": { audience: "ML, platform, DevOps, SRE, and operations professionals responsible for production reliability.", capability: "Operate models and AI services reproducibly with evaluation, monitoring, deployment, and incident controls.", application: "MLOps, LLMOps, AIOps, platform enablement, or production-readiness engagements." },
  "AI Security": { audience: "Security, QA, engineering, governance, and risk professionals working with model-enabled applications.", capability: "Test, threat-model, evaluate, and harden AI systems before and after release.", application: "AI quality assurance, security review, red teaming, governance, or release-readiness work." },
  "AI Strategy": { audience: "Product managers, consultants, operators, founders, and cross-functional leaders shaping AI-enabled products.", capability: "Frame AI opportunities, write implementable requirements, define evaluations, and make responsible roadmap trade-offs.", application: "AI product discovery, advisory, evaluation planning, or delivery leadership." },
  "Data & ML": { audience: "Analysts, data professionals, researchers, and evidence-oriented business professionals.", capability: "Turn data and documents into defensible analysis, models, evaluations, and decision-support systems.", application: "Analytics, data products, model delivery, research, or grounded generative-AI work." },
  "Cloud AI": { audience: "Cloud, platform, data, and application professionals building within Azure, AWS, or Google Cloud environments.", capability: "Select, configure, secure, and deliver managed AI services and production pipelines on a major cloud platform.", application: "Cloud AI implementation, platform delivery, certification-backed technical work, or enterprise integration." },
  "Dev Tooling": { audience: "Developers and technical builders who want a disciplined AI-native software delivery workflow.", capability: "Delegate, review, test, and ship multi-file engineering work with AI coding tools and reusable processes.", application: "Software delivery, developer enablement, product prototyping, or AI-assisted engineering services." },
  "AI-Native Development": { audience: "Professionals — technical or not — who want to plan, build, and ship a real web application or website using AI as a development partner.", capability: "Take a product or client idea from specification through a working full-stack build to a deployed, client-presentable result, using AI deliberately and reviewing its output rather than copy-pasting blind.", application: "Freelance web app or website development, MVP builds, AI feature integration for existing sites, or an internal build capability." },
};

const COURSE_SKILLS: Record<string, string> = {
  "agentic-ai": "ai-agents",
  "agentic-ai-development-with-langchain-langgraph": "ai-agents",
  "ai-agents-with-n8n-no-code": "ai-automation",
  "ai-agents-for-devops-engineers": "ai-agents",
  "ai-product-management": "ai-product-management",
  "ai-security": "ai-security",
  "ai-llm-testing": "ai-testing",
  "mlops-machine-learning-operations": "mlops",
  "data-science-ai-ml": "data-science",
  "data-science-with-generative-ai": "data-science",
  "generative-ai-genai": "rag",
  llmops: "ai-testing",
};

export function getCourseDiscovery(track: string | null, slug: string) {
  const context = TRACK_CONTEXT[track ?? ""] ?? {
    audience: "Professionals who want to build a practical, evidence-backed AI capability.",
    capability: "Understand the system, complete concrete builds, and explain the resulting professional capability.",
    application: "Employment, consulting, freelance, product, or independent work where the capability is relevant.",
  };
  return { ...context, skillSlug: COURSE_SKILLS[slug] };
}
