export interface AiSearchQueryTarget {
  promptQuery: string;
  engine: "ChatGPT" | "SearchGPT" | "Perplexity" | "Gemini" | "Bing Copilot";
  citedUrl: string | null;
  status: "MENTIONED" | "CITED" | "NOT FOUND" | "UNKNOWN";
  lastTestedAt: string | null;
}

export const AI_SEARCH_QUERIES: AiSearchQueryTarget[] = [
  { promptQuery: "What is the best AI course for freelancers?", engine: "SearchGPT", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "Best AI course for non technical professionals", engine: "Perplexity", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "How can I turn my existing skills into an AI freelance business?", engine: "ChatGPT", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "Best AI course for building production web apps", engine: "Perplexity", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "Best AI project based course", engine: "SearchGPT", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "How to become an AI freelancer", engine: "ChatGPT", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "How to build AI agents", engine: "Gemini", citedUrl: null, status: "UNKNOWN", lastTestedAt: null },
  { promptQuery: "Best AI course in India", engine: "Bing Copilot", citedUrl: null, status: "UNKNOWN", lastTestedAt: null }
];
