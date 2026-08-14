/**
 * Centralized beginner-language layer (Value Layer / Beginner UX brief, Phase 4).
 * Every learner-facing surface that would otherwise show a raw technical term should
 * import from here instead of hardcoding its own translation — one source of truth,
 * so the same term reads the same way everywhere in the app.
 *
 * Each entry: `plain` is what the learner sees by default; `technical` is the real
 * term (shown small/secondary); `explanation` is what "What's this?" reveals.
 * Nothing here is invented UX copy — it stays a plain-language RESTATEMENT of a real
 * concept, never a claim about what the product does that isn't true.
 */
export interface GlossaryEntry {
  plain: string;
  technical: string;
  explanation: string;
}

export const GLOSSARY = {
  repository: {
    plain: "Your project code",
    technical: "Repository",
    explanation: "The place your project's files live and get saved over time, so you never lose your work.",
  },
  verification_run: {
    plain: "Project check",
    technical: "Verification run",
    explanation: "An automated check that actually tests your project — not a guess, a real pass/fail result.",
  },
  acceptance_criteria: {
    plain: "How we'll know this works",
    technical: "Acceptance criteria",
    explanation: "The specific, concrete things your project needs to do before it counts as finished.",
  },
  deployment: {
    plain: "Put your app online",
    technical: "Deployment",
    explanation: "Making your project reachable at a real web address, instead of only running on your own computer.",
  },
  environment_variables: {
    plain: "Private settings",
    technical: "Environment variables",
    explanation: "Values your project needs to run (like passwords or keys) that stay hidden from anyone reading your code.",
  },
  api: {
    plain: "A way for two systems to talk",
    technical: "API",
    explanation: "A defined way for one piece of software to ask another for information or to do something.",
  },
  rag: {
    plain: "Give AI trusted information to work from",
    technical: "RAG (retrieval-augmented generation)",
    explanation: "Instead of guessing, the AI first looks up real, relevant content, then answers using that.",
  },
  capstone: {
    plain: "Final real-world project",
    technical: "Capstone",
    explanation: "The course's biggest project — you build it, defend your decisions, and get it scored on real evidence.",
  },
  github: {
    plain: "Where your project code is stored",
    technical: "GitHub",
    explanation: "A service that safely stores your project's code and tracks every change you make to it.",
  },
  branch: {
    plain: "A separate version of your project",
    technical: "Branch",
    explanation: "A copy of your project you can change safely without affecting the version that already works.",
  },
  pull_request: {
    plain: "A request to review your changes",
    technical: "Pull request",
    explanation: "A proposal to merge a set of changes into your main project, usually reviewed before it's accepted.",
  },
  ci_cd: {
    plain: "Automatic project checks",
    technical: "CI/CD",
    explanation: "Your project gets tested and prepared automatically every time you save changes, without you doing it by hand.",
  },
  webhook: {
    plain: "An automatic message between systems",
    technical: "Webhook",
    explanation: "One system automatically tells another system the moment something happens — no one has to check manually.",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryTerm = keyof typeof GLOSSARY;
