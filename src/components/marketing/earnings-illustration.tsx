export interface EarningsRow {
  label: string;
  monthly: number;
  note: string;
}

export interface EarningsIllustration {
  scenario: string;
  rows: EarningsRow[];
}

// Illustrative, track-specific retainer/engagement patterns — not real student
// data (Ropes doesn't have any yet). Each is clearly labeled as an example on
// the page itself. Varies by track so this doesn't read as one boilerplate
// table copy-pasted across all 19 courses.
const BY_TRACK: Record<string, EarningsIllustration> = {
  "Agentic Systems": {
    scenario: "Agent-building retainer",
    rows: [
      { label: "Starting out", monthly: 20000, note: "1 client, single agent" },
      { label: "Building a base", monthly: 45000, note: "2 clients, ongoing support" },
      { label: "Established", monthly: 80000, note: "3+ clients, multi-agent systems" },
    ],
  },
  "AI Engineering": {
    scenario: "AI feature consulting",
    rows: [
      { label: "Starting out", monthly: 25000, note: "1 client, single feature" },
      { label: "Building a base", monthly: 50000, note: "2 clients, ongoing builds" },
      { label: "Established", monthly: 90000, note: "3+ clients, full-stack AI work" },
    ],
  },
  "Dev Tooling": {
    scenario: "AI-assisted dev retainer",
    rows: [
      { label: "Starting out", monthly: 18000, note: "1 client, part-time support" },
      { label: "Building a base", monthly: 40000, note: "2 clients, regular delivery" },
      { label: "Established", monthly: 70000, note: "3+ clients, team-level workflows" },
    ],
  },
  "No-Code Automation": {
    scenario: "Automation build + retainer",
    rows: [
      { label: "Starting out", monthly: 15000, note: "1 client, one automation" },
      { label: "Building a base", monthly: 45000, note: "3 clients, maintained workflows" },
      { label: "Established", monthly: 75000, note: "3 clients, larger monthly retainers" },
    ],
  },
  "AI Operations": {
    scenario: "Ops & observability retainer",
    rows: [
      { label: "Starting out", monthly: 30000, note: "1 client, monitoring setup" },
      { label: "Building a base", monthly: 60000, note: "2 clients, ongoing ops" },
      { label: "Established", monthly: 100000, note: "3+ clients, on-call retainer" },
    ],
  },
  "AI Strategy": {
    scenario: "Fractional AI PM engagement",
    rows: [
      { label: "Starting out", monthly: 35000, note: "1 client, part-time advisory" },
      { label: "Building a base", monthly: 70000, note: "2 clients, roadmap ownership" },
      { label: "Established", monthly: 120000, note: "2–3 clients, fractional AI PM" },
    ],
  },
  "Data & ML": {
    scenario: "Analytics & ML consulting",
    rows: [
      { label: "Starting out", monthly: 20000, note: "1 client, one analysis project" },
      { label: "Building a base", monthly: 45000, note: "2 clients, recurring reporting" },
      { label: "Established", monthly: 80000, note: "3+ clients, ongoing ML work" },
    ],
  },
  "AI Security": {
    scenario: "Security review retainer",
    rows: [
      { label: "Starting out", monthly: 25000, note: "1 client, single review" },
      { label: "Building a base", monthly: 55000, note: "2 clients, periodic audits" },
      { label: "Established", monthly: 90000, note: "3+ clients, ongoing monitoring" },
    ],
  },
  "Cloud AI": {
    scenario: "Cloud AI implementation",
    rows: [
      { label: "Starting out", monthly: 22000, note: "1 client, single deployment" },
      { label: "Building a base", monthly: 48000, note: "2 clients, ongoing support" },
      { label: "Established", monthly: 85000, note: "3+ clients, multi-cloud work" },
    ],
  },
};

const DEFAULT: EarningsIllustration = {
  scenario: "Freelance retainer",
  rows: [
    { label: "Starting out", monthly: 15000, note: "1 client" },
    { label: "Building a base", monthly: 40000, note: "2–3 clients" },
    { label: "Established", monthly: 75000, note: "3+ clients" },
  ],
};

export function getEarningsIllustration(track: string | null): EarningsIllustration {
  if (!track) return DEFAULT;
  return BY_TRACK[track] ?? DEFAULT;
}
