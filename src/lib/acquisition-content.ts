export type AcquisitionPage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  directAnswer: string;
  whoFor: string[];
  principles: Array<{ title: string; description: string }>;
  workflow: Array<{ title: string; description: string }>;
  examples: Array<{ need: string; build: string; service: string }>;
  mistakes: string[];
  faqs: Array<{ question: string; answer: string }>;
  courseSlugs: string[];
  skillSlugs: string[];
  relatedPaths: string[];
};

export const ACQUISITION_PAGES: Record<string, AcquisitionPage> = {
  "ai-freelancing": {
    slug: "ai-freelancing",
    eyebrow: "AI + independent work",
    title: "AI freelancing: turn professional knowledge into client-ready systems",
    description: "A practical guide to AI freelancing: choose a business problem, build a reliable system, create proof, and shape a service without making unrealistic income promises.",
    directAnswer: "AI freelancing means using AI, automation, data, or agent systems to solve a defined client problem as an independent professional. The valuable part is not access to a model. It is your ability to understand the client’s context, design a dependable workflow, document the result, and deliver it responsibly.",
    whoFor: ["Working professionals who know a business function but are new to independent work", "Freelancers who want to add automation or AI systems to an existing service", "Technical professionals who need stronger client discovery, delivery, and proof", "Career switchers who want a portfolio before approaching the market"],
    principles: [
      { title: "Start with domain knowledge", description: "A sales, operations, finance, HR, product, or technical background gives you context that a generic tool tutorial cannot." },
      { title: "Sell a business outcome", description: "Clients buy a clearer process, faster research, safer automation, or better decisions—not prompts or model access." },
      { title: "Build proof before promotion", description: "Use a realistic brief, working demo, decision log, and handover document to show how you think and deliver." },
    ],
    workflow: [
      { title: "Choose one recurring problem", description: "Look for a repeated, costly, or error-prone workflow you already understand." },
      { title: "Map the human and system steps", description: "Document inputs, decisions, exceptions, approvals, and the final output before selecting tools." },
      { title: "Build a constrained solution", description: "Automate the useful portion, preserve human review where risk is material, and handle failure states." },
      { title: "Create portfolio evidence", description: "Show the problem, architecture, test cases, trade-offs, and a measurable operational result in a safe demo." },
      { title: "Package a narrow service", description: "Define the client, scope, deliverables, assumptions, timeline, and support boundary." },
    ],
    examples: [
      { need: "Sales research is inconsistent", build: "A source-grounded account research and qualification workflow", service: "Sales intelligence workflow setup" },
      { need: "Operations reporting is manual", build: "An automated reporting pipeline with approval and exception handling", service: "Operations reporting automation" },
      { need: "Internal knowledge is hard to search", build: "A retrieval-based knowledge assistant with citations and access controls", service: "Internal knowledge system implementation" },
    ],
    mistakes: ["Calling a chatbot an end-to-end business system", "Choosing tools before understanding the workflow", "Using client data without clear permission and safeguards", "Promising revenue or productivity gains that have not been measured", "Building a broad agency offer before completing one credible delivery"],
    faqs: [
      { question: "What is AI freelancing?", answer: "It is independent client work that applies AI-related capabilities to a defined business problem. It can include workflow automation, knowledge systems, agent design, evaluation, AI product work, data systems, or production operations." },
      { question: "Do I need to be a programmer?", answer: "Not for every path. No-code automation and workflow design can be suitable for non-technical professionals. Production engineering, security, and advanced data paths require progressively deeper technical capability." },
      { question: "What should an AI freelance portfolio include?", answer: "Include a clear problem statement, workflow map, working demonstration, architecture, test evidence, limitations, human-review points, and a client-style handover. Never expose private client data." },
    ],
    courseSlugs: ["ai-agents-with-n8n-no-code", "agentic-ai", "ai-product-management"],
    skillSlugs: ["ai-automation", "ai-agents", "ai-product-management"],
    relatedPaths: ["/turn-skills-into-freelance-services", "/ai-automation-freelancing", "/freelancing-without-coding"],
  },
  "side-hustle-for-working-professionals": {
    slug: "side-hustle-for-working-professionals",
    eyebrow: "Build alongside your job",
    title: "An AI side hustle for working professionals—without discarding your career",
    description: "A realistic path for building an AI-enabled side service around your existing professional expertise while protecting time, trust, and employment obligations.",
    directAnswer: "A useful AI side hustle for a working professional begins with a problem you already understand, a small system you can build outside work, and a narrowly scoped service you can deliver consistently. It should fit your available hours, respect your employment contract, and never reuse an employer’s confidential data or intellectual property.",
    whoFor: ["Employees exploring a second professional capability", "Parents or caregivers with limited weekly build time", "Professionals testing independent work before changing careers", "Specialists who want to productize a repeatable part of their expertise"],
    principles: [
      { title: "Use a narrow weekly scope", description: "One useful build completed in four to eight focused sessions is better than an ambitious project that never reaches a demo." },
      { title: "Keep clean boundaries", description: "Use your own devices, accounts, time, examples, and datasets. Review employment, non-compete, and confidentiality obligations." },
      { title: "Test capability before demand", description: "First prove that you can deliver the workflow reliably; then interview potential users and refine the offer." },
    ],
    workflow: [
      { title: "Inventory repeated problems", description: "List tasks people in your function regularly struggle with, excluding any confidential employer information." },
      { title: "Select one small outcome", description: "Choose something demonstrable, such as a reporting workflow, research system, or knowledge assistant." },
      { title: "Block a sustainable cadence", description: "Set a realistic weekly learning and building schedule that does not compromise your primary work." },
      { title: "Produce a safe demonstration", description: "Use synthetic or public data and document what the system can and cannot do." },
      { title: "Offer a bounded pilot", description: "Define the exact deliverable, revision limit, client responsibilities, and support window." },
    ],
    examples: [
      { need: "A consultant repeats desk research", build: "A cited research synthesis workflow", service: "Research workflow setup and training" },
      { need: "A small team maintains SOPs manually", build: "A searchable, grounded SOP assistant", service: "Knowledge-base implementation" },
      { need: "A marketer spends weekends formatting reports", build: "A campaign reporting and narrative pipeline", service: "Marketing reporting automation" },
    ],
    mistakes: ["Using employer data in a portfolio", "Choosing a service that requires 24/7 support", "Buying many tools before validating a workflow", "Treating a side hustle as guaranteed salary replacement", "Ignoring taxes, contracts, or professional obligations"],
    faqs: [
      { question: "Can I start an AI side hustle while working full-time?", answer: "Potentially, if your contract permits it and you separate time, data, equipment, and intellectual property. Start with a small, low-support service and seek legal or tax advice when needed." },
      { question: "How many hours should I plan?", answer: "Choose a cadence you can maintain. Ropes asks learners to plan around their real weekly availability; progress depends on background, project complexity, and consistency rather than a universal hour target." },
      { question: "What is a sensible first offer?", answer: "A bounded assessment or implementation around one workflow is usually clearer than an open-ended promise to transform an entire business with AI." },
    ],
    courseSlugs: ["ai-agents-with-n8n-no-code", "ai-product-management", "generative-ai-genai"],
    skillSlugs: ["ai-automation", "ai-product-management", "rag"],
    relatedPaths: ["/ai-freelancing", "/turn-skills-into-freelance-services", "/for-professionals"],
  },
  "solopreneur-with-ai": {
    slug: "solopreneur-with-ai",
    eyebrow: "One-person business systems",
    title: "Build a more capable one-person business with AI",
    description: "Learn where AI can help a solopreneur research, deliver, document, and operate—without automating judgment, trust, or accountability away.",
    directAnswer: "AI can help a solopreneur operate with more leverage by reducing repetitive research, administration, reporting, and content transformation. A durable one-person business still needs a specific customer, a clear offer, reliable delivery, human judgment, and trust. AI supports those systems; it does not replace them.",
    whoFor: ["Independent consultants formalising delivery", "Freelancers turning custom work into a repeatable service", "Creators or educators building operational systems", "Professionals validating a one-person business before leaving employment"],
    principles: [
      { title: "Systemise before scaling", description: "Write the delivery process, quality bar, and exception rules before trying to automate volume." },
      { title: "Keep the founder in high-risk decisions", description: "Pricing, commitments, sensitive communication, and material client decisions need accountable review." },
      { title: "Create reusable assets", description: "Templates, intake forms, research routines, test checklists, and handover documents make delivery more consistent." },
    ],
    workflow: [
      { title: "Define one buyer and problem", description: "A focused offer makes both acquisition and delivery easier to understand." },
      { title: "Map the service lifecycle", description: "Cover discovery, proposal, onboarding, production, review, handover, and support." },
      { title: "Automate low-risk repetition", description: "Prioritise gathering, transforming, routing, and drafting before autonomous decisions." },
      { title: "Add quality controls", description: "Use source checks, test cases, approval gates, and versioned templates." },
      { title: "Measure delivery health", description: "Track cycle time, rework, client questions, failure cases, and utilisation—not vanity automation counts." },
    ],
    examples: [
      { need: "Client onboarding is inconsistent", build: "An intake-to-project-brief workflow", service: "A more reliable consulting onboarding process" },
      { need: "Research takes too long", build: "A source-grounded research and review pipeline", service: "Faster evidence-backed advisory delivery" },
      { need: "Handover depends on memory", build: "A structured documentation and training system", service: "Repeatable implementation and handover" },
    ],
    mistakes: ["Automating an unclear process", "Letting AI send sensitive client communication without review", "Building a tool stack with no offer", "Using generated content without fact-checking", "Confusing a one-person business with a passive-income guarantee"],
    faqs: [
      { question: "What is an AI-enabled solopreneur?", answer: "It is a one-person business owner who uses AI and automation as operating leverage while remaining responsible for customer value, quality, privacy, and decisions." },
      { question: "What should a solopreneur automate first?", answer: "Start with frequent, rules-based, reversible work such as intake, data routing, first-draft research, reporting preparation, or documentation—not high-stakes judgment." },
      { question: "Can AI run a one-person business automatically?", answer: "No reliable business should assume that. Customer discovery, judgment, accountability, relationships, and exception handling still require human ownership." },
    ],
    courseSlugs: ["ai-agents-with-n8n-no-code", "ai-product-management", "agentic-ai"],
    skillSlugs: ["ai-automation", "ai-agents", "ai-product-management"],
    relatedPaths: ["/ai-freelancing", "/side-hustle-for-working-professionals", "/turn-skills-into-freelance-services"],
  },
  "turn-skills-into-freelance-services": {
    slug: "turn-skills-into-freelance-services",
    eyebrow: "Existing skill → new capability",
    title: "Turn your existing professional skills into an AI-powered freelance service",
    description: "A function-first method for combining domain expertise, AI systems, portfolio proof, and clear delivery into a credible freelance service.",
    directAnswer: "To turn an existing skill into a freelance service, identify a costly problem you understand, define the outcome a buyer needs, build a repeatable AI-assisted workflow, and create evidence that you can deliver it safely. Your domain expertise is the starting asset; AI adds leverage, and the service packages that capability for a market.",
    whoFor: ["Sales, marketing, operations, finance, HR, supply-chain, product, consulting, and administrative professionals", "Developers, data practitioners, QA professionals, cloud engineers, and technical operators", "Career switchers who want to preserve the value of prior experience", "Freelancers who need a clearer, more productised offer"],
    principles: [
      { title: "Translate tasks into outcomes", description: "‘I know prompts’ is not an offer. ‘I can turn weekly source data into a reviewed decision report’ is closer to one." },
      { title: "Add AI where it improves the system", description: "Use models for interpretation or generation, automation for repeatable routing, and human review for context and risk." },
      { title: "Make delivery inspectable", description: "A client should be able to understand inputs, outputs, assumptions, controls, and ownership after handover." },
    ],
    workflow: [
      { title: "Extract your domain advantage", description: "List the decisions, vocabulary, workflows, and failure modes you understand better than a beginner." },
      { title: "Find a buyer-visible problem", description: "Choose an issue with a clear owner, current workaround, and useful end state." },
      { title: "Design the smallest complete system", description: "Include intake, processing, review, delivery, monitoring, and handover—not only the AI step." },
      { title: "Create a proof artifact", description: "Demonstrate the system using safe data and document the choices you made." },
      { title: "Write the service boundary", description: "State who it is for, what is included, what is excluded, what the client provides, and what success means." },
    ],
    examples: [
      { need: "Sales teams cannot prioritise accounts", build: "A research, scoring, and human-review pipeline", service: "Account research system implementation" },
      { need: "Finance reporting requires repeated manual commentary", build: "A controlled analysis and narrative-drafting workflow", service: "Management reporting workflow design" },
      { need: "HR onboarding answers vary by manager", build: "A cited policy and onboarding knowledge assistant", service: "HR knowledge-system setup" },
    ],
    mistakes: ["Throwing away domain expertise to chase a generic AI title", "Offering every AI service to every client", "Building without interviewing a potential user", "Showing only screenshots instead of decisions and evidence", "Pricing or promising outcomes before understanding scope"],
    faqs: [
      { question: "Can I freelance with my existing professional skills?", answer: "Yes, when those skills solve a problem another organisation is willing to engage external help for. AI may help you deliver faster or create a new system, but the offer still needs a clear buyer and outcome." },
      { question: "How do I choose a service?", answer: "Start where you have credible context: a function, industry, workflow, or recurring decision. Interview potential users, then choose a narrow problem you can demonstrate end to end." },
      { question: "What counts as proof?", answer: "A safe, realistic project with a working output, documented architecture, tests, limitations, and handover is stronger than a certificate alone." },
    ],
    courseSlugs: ["ai-agents-with-n8n-no-code", "ai-product-management", "data-science-with-generative-ai"],
    skillSlugs: ["ai-automation", "ai-product-management", "data-science"],
    relatedPaths: ["/for-professionals", "/ai-freelancing", "/resources/projects"],
  },
  "ai-automation-freelancing": {
    slug: "ai-automation-freelancing",
    eyebrow: "Workflow design + delivery",
    title: "AI automation freelancing: build systems clients can operate after handover",
    description: "Learn what AI automation freelancers actually do, what to build, where no-code fits, how to control risk, and how to turn a workflow into portfolio evidence.",
    directAnswer: "AI automation freelancing is the independent design and implementation of workflows that combine triggers, data, business rules, AI model steps, human approvals, and downstream actions. Good delivery includes discovery, exception handling, testing, documentation, permissions, and handover—not only connecting nodes in an automation tool.",
    whoFor: ["Operations and process professionals", "No-code builders moving beyond simple zaps", "Freelancers adding system implementation to marketing, sales, or consulting services", "Technical professionals who want a productised automation offer"],
    principles: [
      { title: "Map before building", description: "Document the current workflow, owners, inputs, exceptions, and failure cost before opening an automation canvas." },
      { title: "Use AI selectively", description: "Deterministic rules are better for predictable logic; models help with classification, extraction, synthesis, and drafting when outputs are checked." },
      { title: "Design for operations", description: "Logging, retries, alerts, approvals, permissions, and maintainability decide whether a client can trust the system." },
    ],
    workflow: [
      { title: "Discovery", description: "Observe the current process and quantify volume, delay, rework, and risk." },
      { title: "Workflow specification", description: "Define triggers, data contracts, branches, approvals, failure handling, and the final delivery." },
      { title: "Incremental build", description: "Implement deterministic steps first, then add AI only where it earns its complexity." },
      { title: "Evaluation", description: "Test normal, ambiguous, adversarial, and failure cases with expected results." },
      { title: "Handover", description: "Provide operating instructions, access ownership, monitoring, change control, and support boundaries." },
    ],
    examples: [
      { need: "Inbound leads are routed manually", build: "An intake, enrichment, qualification, and approval workflow", service: "Lead operations automation" },
      { need: "Weekly reports require copy-paste work", build: "A data collection, validation, narrative, and review pipeline", service: "Reporting workflow implementation" },
      { need: "Support triage is inconsistent", build: "A classification, priority, suggested-response, and escalation system", service: "Support operations automation" },
    ],
    mistakes: ["Automating a broken process", "Giving models authority over irreversible actions", "Skipping access-control and data-retention decisions", "Testing only the happy path", "Leaving the client dependent on the builder for every change"],
    faqs: [
      { question: "What does an AI automation freelancer deliver?", answer: "Typical deliverables include a workflow specification, configured automation, model instructions where needed, tests, monitoring, documentation, training, and a defined support period." },
      { question: "Is n8n enough to start?", answer: "It can be a strong orchestration layer for many no-code and low-code workflows. You still need process analysis, APIs, data handling, security, evaluation, and client delivery skills." },
      { question: "What should I build for a portfolio?", answer: "Build one complete workflow with realistic inputs, exception paths, human approval, logs, tests, and handover documentation. Explain why each step exists." },
    ],
    courseSlugs: ["ai-agents-with-n8n-no-code", "agentic-ai", "aiops"],
    skillSlugs: ["ai-automation", "ai-agents", "ai-testing"],
    relatedPaths: ["/ai-freelancing", "/freelancing-without-coding", "/resources/projects"],
  },
  "freelancing-without-coding": {
    slug: "freelancing-without-coding",
    eyebrow: "A non-technical starting path",
    title: "Freelancing with AI without becoming a programmer",
    description: "A clear guide for non-technical professionals who want to build useful AI-assisted services with no-code tools, domain expertise, and responsible delivery.",
    directAnswer: "You can build some AI-enabled freelance services without becoming a software engineer. Useful entry points include workflow mapping, no-code automation, AI-assisted research, knowledge systems, reporting, and implementation support. You still need to understand data, privacy, testing, limitations, and the client’s business process.",
    whoFor: ["Operations, sales, marketing, HR, finance, support, administration, education, and consulting professionals", "Subject-matter experts who can describe a workflow but have not written software", "Freelancers who want to add practical automation to an existing service", "Career switchers choosing a no-code first project"],
    principles: [
      { title: "No-code is still systems work", description: "Visual tools reduce syntax; they do not remove the need for logic, data mapping, permissions, error handling, and quality control." },
      { title: "Domain judgment is valuable", description: "Knowing what a good answer looks like, which exception matters, and who must approve it can be more important than writing code." },
      { title: "Know when to escalate", description: "Custom integrations, sensitive data, high scale, complex security, or production infrastructure may require an experienced engineer." },
    ],
    workflow: [
      { title: "Learn workflow fundamentals", description: "Understand triggers, actions, fields, branches, webhooks, APIs, and approvals at a conceptual level." },
      { title: "Choose a familiar process", description: "Use a workflow from your own function so you can judge whether the result is useful." },
      { title: "Build with safe data", description: "Use synthetic or public information until you have permission and appropriate controls." },
      { title: "Test edge cases", description: "Check missing inputs, ambiguous requests, model errors, duplicate events, and failed actions." },
      { title: "Document the handover", description: "Explain how to operate, monitor, pause, change, and obtain support for the system." },
    ],
    examples: [
      { need: "Meeting notes never become actions", build: "A reviewed notes-to-task workflow", service: "Team workflow setup" },
      { need: "Research sources are scattered", build: "A source collection and synthesis workspace", service: "Research operations setup" },
      { need: "Client intake is inconsistent", build: "A guided intake, validation, and brief-generation flow", service: "Service-business onboarding automation" },
    ],
    mistakes: ["Believing no-code means no learning", "Handling sensitive data without understanding where it is stored", "Trusting generated outputs without review", "Taking on production-critical work beyond your competence", "Selling a tool rather than a maintained workflow"],
    faqs: [
      { question: "Can non-technical professionals freelance with AI?", answer: "Yes, for paths where domain knowledge, process design, no-code tooling, evaluation, and client delivery are sufficient. The required technical depth depends on risk and complexity." },
      { question: "What technical concepts should I still learn?", answer: "Learn data types, APIs, authentication basics, privacy, branching logic, testing, model limitations, error handling, and access ownership even if you do not write application code." },
      { question: "When do I need a developer?", answer: "Bring in engineering support for custom software, complex authentication, regulated or highly sensitive data, large-scale systems, deep integrations, or infrastructure with material operational risk." },
    ],
    courseSlugs: ["ai-agents-with-n8n-no-code", "ai-product-management", "generative-ai-genai"],
    skillSlugs: ["ai-automation", "rag", "ai-product-management"],
    relatedPaths: ["/ai-automation-freelancing", "/turn-skills-into-freelance-services", "/for-professionals"],
  },
};

export const ACQUISITION_SLUGS = Object.keys(ACQUISITION_PAGES);

export type SkillGuide = {
  slug: string;
  name: string;
  definition: string;
  whyItMatters: string;
  capabilities: string[];
  portfolio: string;
  applications: string[];
  courseSlugs: string[];
  relatedPath: string;
};

export const SKILL_GUIDES: Record<string, SkillGuide> = {
  "ai-automation": { slug: "ai-automation", name: "AI automation", definition: "AI automation combines repeatable workflow logic with model-based steps such as classification, extraction, synthesis, or drafting.", whyItMatters: "It can reduce manual handling while preserving approval where judgment or risk matters.", capabilities: ["Workflow discovery and mapping", "Triggers, data mapping, routing, and APIs", "Human-in-the-loop design", "Logging, retries, and exception handling", "Testing and client handover"], portfolio: "A complete business workflow with realistic inputs, approval gates, failure handling, test evidence, and operating documentation.", applications: ["Lead operations", "Reporting", "Support triage", "Research workflows", "Internal administration"], courseSlugs: ["ai-agents-with-n8n-no-code", "agentic-ai"], relatedPath: "/ai-automation-freelancing" },
  "ai-agents": { slug: "ai-agents", name: "AI agents", definition: "An AI agent is a system that uses a model to choose and execute actions toward a goal within defined tools, context, constraints, and oversight.", whyItMatters: "Agents can help with multi-step work, but they add uncertainty and require stronger evaluation, permissions, monitoring, and escalation design.", capabilities: ["Agent use-case selection", "Tool and memory design", "State, orchestration, and approvals", "Evaluation and guardrails", "Production monitoring"], portfolio: "A tool-using agent with a clear architecture, bounded permissions, evaluation set, decision log, and human override.", applications: ["Research assistants", "Knowledge work", "Operations triage", "Multi-stage drafting and review", "Developer workflows"], courseSlugs: ["agentic-ai", "agentic-ai-development-with-langchain-langgraph"], relatedPath: "/ai-freelancing" },
  rag: { slug: "rag", name: "Retrieval-augmented generation (RAG)", definition: "RAG retrieves relevant source material at request time and gives it to a generative model so an answer can be grounded in selected evidence.", whyItMatters: "It is useful when answers must reflect private or frequently changing material rather than model memory alone.", capabilities: ["Document preparation and chunking", "Retrieval design", "Context assembly", "Citation and answer controls", "Faithfulness evaluation"], portfolio: "A grounded knowledge assistant over a safe document set, with citations, access assumptions, retrieval tests, and known limitations.", applications: ["Policy assistants", "Research libraries", "Product support knowledge", "SOP search", "Document analysis"], courseSlugs: ["generative-ai-genai", "agentic-ai-development-with-langchain-langgraph", "data-science-with-generative-ai"], relatedPath: "/turn-skills-into-freelance-services" },
  "ai-testing": { slug: "ai-testing", name: "AI and LLM testing", definition: "AI testing evaluates probabilistic outputs for qualities such as faithfulness, relevance, safety, robustness, fairness, and task success.", whyItMatters: "Traditional pass/fail tests are not enough when outputs vary, models change, and quality depends on context.", capabilities: ["Golden-dataset design", "Task-specific evaluation criteria", "RAG and prompt regression testing", "Adversarial cases", "Quality gates in delivery pipelines"], portfolio: "An evaluation harness with documented cases, scoring logic, baseline results, regression thresholds, and a findings report.", applications: ["RAG quality assurance", "Prompt regression", "Agent testing", "Model comparison", "AI release readiness"], courseSlugs: ["ai-llm-testing", "ai-security", "llmops"], relatedPath: "/ai-freelancing" },
  "ai-security": { slug: "ai-security", name: "AI security", definition: "AI security protects model-enabled applications from risks including prompt injection, unsafe tool use, data leakage, poisoned retrieval, and excessive permissions.", whyItMatters: "AI systems can convert untrusted text into actions, so security must cover data, instructions, tools, identity, monitoring, and human authority.", capabilities: ["Threat modelling", "Prompt-injection testing", "Least-privilege tool design", "Input and output controls", "Security review and monitoring"], portfolio: "A threat model, red-team test set, mitigations, residual-risk assessment, and security handover for a sample AI application.", applications: ["Agent security reviews", "RAG threat assessments", "Governance controls", "Red-team exercises", "Secure deployment guidance"], courseSlugs: ["ai-security", "ai-llm-testing"], relatedPath: "/ai-freelancing" },
  mlops: { slug: "mlops", name: "MLOps", definition: "MLOps applies software delivery and operational discipline to data, model training, deployment, monitoring, and retraining.", whyItMatters: "A model only creates durable value when its data, versions, deployment, performance, and failure response are reproducible and observable.", capabilities: ["Experiment tracking", "Data and model pipelines", "Containerised serving", "Monitoring and drift detection", "Retraining and release operations"], portfolio: "A reproducible training-to-deployment pipeline with tracked experiments, an endpoint, monitoring, and a redeployment runbook.", applications: ["Model delivery", "Production monitoring", "ML platform work", "Deployment consulting", "Operational readiness"], courseSlugs: ["mlops-machine-learning-operations", "llmops", "aiops"], relatedPath: "/ai-freelancing" },
  "ai-product-management": { slug: "ai-product-management", name: "AI product management", definition: "AI product management defines valuable, feasible, and responsible products when core behaviour is probabilistic rather than fully deterministic.", whyItMatters: "AI products need explicit user value, evaluation criteria, fallback behaviour, cost constraints, and honest communication about limitations.", capabilities: ["AI opportunity framing", "AI PRDs", "Evaluation and success metrics", "Roadmaps and trade-offs", "Stakeholder communication"], portfolio: "An AI feature brief, PRD, evaluation plan, risk register, and roadmap grounded in a real user problem.", applications: ["AI feature discovery", "Product advisory", "Evaluation planning", "Roadmapping", "Cross-functional delivery"], courseSlugs: ["ai-product-management", "generative-ai-genai"], relatedPath: "/turn-skills-into-freelance-services" },
  "data-science": { slug: "data-science", name: "Data science with AI", definition: "Data science uses data preparation, analysis, statistics, and machine learning to produce evidence, predictions, and decision support; generative AI can add natural-language or document capabilities where appropriate.", whyItMatters: "It creates a disciplined evidence layer beneath AI claims and helps teams choose methods based on the problem rather than hype.", capabilities: ["Exploratory analysis", "Feature and model selection", "Evaluation and error analysis", "Grounded analytics with RAG", "End-to-end delivery"], portfolio: "A documented analysis or model pipeline with a business question, clean data, method choices, evaluation, limitations, and a usable delivery artifact.", applications: ["Business analytics", "Forecasting support", "Decision systems", "Document analytics", "Model evaluation"], courseSlugs: ["data-science-ai-ml", "data-science-with-generative-ai"], relatedPath: "/turn-skills-into-freelance-services" },
};

export const SKILL_SLUGS = Object.keys(SKILL_GUIDES);

export const PROJECT_BRIEFS = [
  { title: "Lead qualification and routing system", problem: "A small sales team reviews every inbound lead manually.", approach: "Map qualification rules, add source-grounded enrichment, use AI only for ambiguous classification, and require approval before routing.", deliverable: "Workflow map, configured automation, evaluation cases, decision log, and handover guide.", skill: "AI automation", skillSlug: "ai-automation", courseSlug: "ai-agents-with-n8n-no-code" },
  { title: "Cited internal knowledge assistant", problem: "Employees cannot find consistent answers across policies and SOPs.", approach: "Prepare a safe document set, design retrieval, require citations, test unanswered questions, and state access assumptions.", deliverable: "Working RAG assistant, retrieval test set, limitations report, and operating documentation.", skill: "RAG", skillSlug: "rag", courseSlug: "generative-ai-genai" },
  { title: "AI application security review", problem: "A tool-using assistant has been built without a structured threat review.", approach: "Map assets and trust boundaries, test injection and permission abuse, apply layered controls, and document residual risk.", deliverable: "Threat model, red-team cases, mitigation evidence, and review report.", skill: "AI security", skillSlug: "ai-security", courseSlug: "ai-security" },
  { title: "LLM regression evaluation suite", problem: "Prompt and model changes ship without evidence that quality remains acceptable.", approach: "Create a golden dataset, define task-specific criteria, benchmark a baseline, and add release thresholds.", deliverable: "Evaluation harness, results dashboard, regression policy, and findings summary.", skill: "AI testing", skillSlug: "ai-testing", courseSlug: "ai-llm-testing" },
  { title: "Production model pipeline", problem: "A useful model exists only as an untracked notebook.", approach: "Track experiments, package the model, expose an endpoint, monitor performance, and define retraining triggers.", deliverable: "Reproducible pipeline, container, endpoint, monitoring view, and runbook.", skill: "MLOps", skillSlug: "mlops", courseSlug: "mlops-machine-learning-operations" },
  { title: "AI feature PRD and evaluation plan", problem: "A team wants an AI feature but has not defined value, failure behaviour, or success criteria.", approach: "Research the user need, frame the AI role, define non-AI fallbacks, set evaluation metrics, and document trade-offs.", deliverable: "Feature brief, PRD, evaluation plan, risk register, and two-quarter roadmap.", skill: "AI product management", skillSlug: "ai-product-management", courseSlug: "ai-product-management" },
];
