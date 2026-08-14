export interface KeywordTarget {
  query: string;
  intentCategory: string;
  targetRoute: string;
  currentRank: number | null; // null = unmeasured without API
  impressions: number;
  clicks: number;
  status: "TOP 3" | "TOP 10" | "TOP 20" | "RISING" | "FALLING" | "NOT RANKING" | "UNMEASURED";
}

export const TARGET_KEYWORDS: KeywordTarget[] = [
  { query: "AI course", intentCategory: "Education", targetRoute: "/courses", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI courses", intentCategory: "Education", targetRoute: "/courses", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI course India", intentCategory: "Education", targetRoute: "/courses", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI freelancing", intentCategory: "Acquisition", targetRoute: "/ai-freelancing", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI freelancer", intentCategory: "Acquisition", targetRoute: "/ai-freelancing", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI automation", intentCategory: "Skill", targetRoute: "/resources/skills/ai-automation", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI automation freelancing", intentCategory: "Acquisition", targetRoute: "/ai-automation-freelancing", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI agents course", intentCategory: "Skill", targetRoute: "/resources/skills/ai-agents", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI engineering course", intentCategory: "Skill", targetRoute: "/courses", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI web app development", intentCategory: "Acquisition", targetRoute: "/turn-skills-into-freelance-services", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI website development", intentCategory: "Acquisition", targetRoute: "/solopreneur-with-ai", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI coding course", intentCategory: "Skill", targetRoute: "/courses", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI career", intentCategory: "Acquisition", targetRoute: "/for-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI career transition", intentCategory: "Acquisition", targetRoute: "/for-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI side hustle", intentCategory: "Acquisition", targetRoute: "/side-hustle-for-working-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI side hustle India", intentCategory: "Acquisition", targetRoute: "/side-hustle-for-working-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI solopreneur", intentCategory: "Acquisition", targetRoute: "/solopreneur-with-ai", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "one person business AI", intentCategory: "Acquisition", targetRoute: "/solopreneur-with-ai", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI projects", intentCategory: "Resource", targetRoute: "/resources/projects", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI portfolio projects", intentCategory: "Resource", targetRoute: "/resources/projects", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI for non technical professionals", intentCategory: "Acquisition", targetRoute: "/freelancing-without-coding", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI for sales", intentCategory: "Acquisition", targetRoute: "/for-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI for marketing", intentCategory: "Acquisition", targetRoute: "/for-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI for finance", intentCategory: "Acquisition", targetRoute: "/for-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI for operations", intentCategory: "Acquisition", targetRoute: "/for-professionals", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI production readiness", intentCategory: "Tool", targetRoute: "/tools/production-readiness-checker", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI project readiness", intentCategory: "Tool", targetRoute: "/tools/ai-readiness-checker", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" },
  { query: "AI freelance readiness", intentCategory: "Tool", targetRoute: "/tools/freelance-readiness-checker", currentRank: null, impressions: 0, clicks: 0, status: "UNMEASURED" }
];
