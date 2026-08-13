const COURSE_VISUALS: Record<string, { src: string; alt: string }> = {
  "agentic-ai": {
    src: "/images/courses/agentic-ai.webp",
    alt: "An Indian AI practitioner mapping an autonomous agent's decisions, tools, and memory",
  },
  "agentic-ai-development-with-langchain-langgraph": {
    src: "/images/courses/agentic-ai-development-with-langchain-langgraph.webp",
    alt: "A stateful multi-agent graph connected through tools, retrieval, and orchestration",
  },
  "claude-code-ai": {
    src: "/images/courses/claude-code-ai.webp",
    alt: "An Indian developer working inside an AI-native coding environment",
  },
  "ai-stack": {
    src: "/images/courses/ai-stack.webp",
    alt: "A dimensional AI engineering stack connecting models, data, retrieval, and deployment",
  },
  "ai-engineering-for-forward-deployed-engineer": {
    src: "/images/courses/ai-engineering-for-forward-deployed-engineer.webp",
    alt: "An Indian forward-deployed engineer integrating AI inside a client operations environment",
  },
  "generative-ai-genai": {
    src: "/images/courses/generative-ai-genai.webp",
    alt: "A generative model producing grounded document, image, audio, and code outputs",
  },
  "ai-agents-with-n8n-no-code": {
    src: "/images/courses/ai-agents-with-n8n-no-code.webp",
    alt: "An Indian professional assembling a visual no-code AI agent workflow",
  },
  "ai-agents-for-devops-engineers": {
    src: "/images/courses/ai-agents-for-devops-engineers.webp",
    alt: "An Indian DevOps engineer monitoring an AI-assisted deployment recovery workflow",
  },
  "mlops-machine-learning-operations": {
    src: "/images/courses/mlops-machine-learning-operations.webp",
    alt: "A reproducible machine-learning pipeline from data and training to deployment and monitoring",
  },
  aiops: {
    src: "/images/courses/aiops.webp",
    alt: "An Indian operations specialist correlating infrastructure alerts into one resolved incident",
  },
  llmops: {
    src: "/images/courses/llmops.webp",
    alt: "A production language-model lifecycle with prompt versions, evaluations, cost, and monitoring",
  },
  "ai-product-management": {
    src: "/images/courses/ai-product-management.webp",
    alt: "An Indian AI product manager shaping a roadmap from user evidence and evaluation metrics",
  },
  "data-science-ai-ml": {
    src: "/images/courses/data-science-ai-ml.webp",
    alt: "An Indian data scientist moving from raw data through modeling and evaluation",
  },
  "data-science-with-generative-ai": {
    src: "/images/courses/data-science-with-generative-ai.webp",
    alt: "Structured analytics and document retrieval producing a grounded generative insight",
  },
  "ai-security": {
    src: "/images/courses/ai-security.webp",
    alt: "An Indian security engineer protecting an AI agent with layered defenses",
  },
  "azure-ai": {
    src: "/images/courses/azure-ai.webp",
    alt: "An Indian cloud engineer studying a secure enterprise AI service architecture",
  },
  "aws-ai": {
    src: "/images/courses/aws-ai.webp",
    alt: "A scalable cloud AI system connecting models, secure data, training, and inference",
  },
  "gcp-ai": {
    src: "/images/courses/gcp-ai.webp",
    alt: "A multimodal cloud AI pipeline joining data, retrieval, models, and deployment",
  },
  "ai-llm-testing": {
    src: "/images/courses/ai-llm-testing.webp",
    alt: "An Indian quality engineer evaluating varied language-model outputs against test cases",
  },
  "ai-native-web-app-builder": {
    src: "/images/courses/ai-native-web-app-builder.webp",
    alt: "An Indian product builder reviewing a full-stack AI web application, its data model, authentication flow, and source code",
  },
  "ai-native-website-builder": {
    src: "/images/courses/ai-native-website-builder.webp",
    alt: "An Indian designer-developer refining a cinematic business website across responsive desktop and mobile layouts",
  },
};

const FALLBACK_VISUAL = {
  src: "/images/ropes/course-builder.webp",
  alt: "An Indian professional building an AI system through a hands-on course",
};

export function getCourseVisual(slug: string) {
  return COURSE_VISUALS[slug] ?? FALLBACK_VISUAL;
}
