#!/usr/bin/env node
/**
 * 200-user AI load engine — mock-provider load test for the AI resource governor.
 *
 * IMPORTANT — what this is and isn't:
 * This script does NOT import src/lib/ai/router.ts directly. That file is TypeScript,
 * uses the `@/` path alias, and imports "server-only" + the real Supabase/Cerebras
 * clients — none of which resolve in a plain Node script without the Next.js/TS build
 * pipeline (this repo has no ts-node/tsx dependency). Instead, this script is a FAITHFUL
 * PARALLEL REIMPLEMENTATION of the governor algorithm in router.ts as of this commit:
 * same concurrency ceiling, same priority-tier ratios, same per-user concurrency cap,
 * same daily budget, same circuit-breaker thresholds/cooldown, same retry/backoff/jitter
 * formula, same in-flight dedup, same opt-in cache. The constants below are hand-kept in
 * sync with router.ts — see the "KNOWN LIMITATION" note in the final report: a future
 * change to router.ts's governor logic will NOT automatically apply here.
 *
 * It NEVER calls the real Cerebras API — every "provider call" here is a deterministic
 * mock with configurable, seeded-random latency/failure behavior.
 *
 * Usage: node scripts/load-test-ai-router.mjs
 */

// ---- Constants mirrored from src/lib/ai/router.ts (hardcoded defaults, no env overrides set) ----
const MAX_CONCURRENT_REQUESTS = 20;
const PRIORITY_CONCURRENCY_RATIO = { P0: 1, P1: 0.75, P2: 0.5, P3: 0.25 };
const MAX_CONCURRENT_PER_USER = 3;
const DAILY_CALLS_PER_USER = 150;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 30_000;

const TASK_PRIORITY = {
  project_review: "P0", capstone_defence_questions: "P0", capstone_scoring: "P0",
  code_review: "P0", architecture_drift_check: "P0", ai_code_defense: "P0", test_generation: "P0",
  hint_generation: "P1", socratic_questioning: "P1", lesson_explanation: "P1", debug_assistance: "P1",
  concept_rescue: "P1", code_explanation: "P1", simulator_turn: "P1", simulator_evaluation: "P1",
  interview_simulation: "P1",
  recommendation: "P2", portfolio_generation: "P2", monetisation_planning: "P2", daily_mission_framing: "P2",
  idea_plan_generation: "P2", learner_ai_feature_execution: "P2", architecture_diagram_generation: "P2",
  proposal_generation: "P2",
  content_summarization: "P3", skill_analysis: "P3", quality_lab_summary: "P3", ai_eval_judge: "P3",
};

const TASK_CONFIG = {
  lesson_explanation: { timeoutMs: 20_000, maxRetries: 2, cacheTtlMs: 10 * 60_000 },
  hint_generation: { timeoutMs: 15_000, maxRetries: 2, cacheTtlMs: 0 },
  concept_rescue: { timeoutMs: 30_000, maxRetries: 2, cacheTtlMs: 0 },
  debug_assistance: { timeoutMs: 30_000, maxRetries: 2, cacheTtlMs: 0 },
  capstone_scoring: { timeoutMs: 40_000, maxRetries: 3, cacheTtlMs: 0 },
  capstone_defence_questions: { timeoutMs: 30_000, maxRetries: 3, cacheTtlMs: 0 },
  monetisation_planning: { timeoutMs: 20_000, maxRetries: 2, cacheTtlMs: 0 },
  proposal_generation: { timeoutMs: 40_000, maxRetries: 2, cacheTtlMs: 0 },
  project_review: { timeoutMs: 30_000, maxRetries: 3, cacheTtlMs: 0 },
  ai_eval_judge: { timeoutMs: 20_000, maxRetries: 2, cacheTtlMs: 0 },
};

// Realistic request-type mix requested in the brief, mapped onto real AITask values.
const REQUEST_TYPES = [
  { label: "AI Coach", task: "lesson_explanation", weight: 30 },
  { label: "concept rescue", task: "concept_rescue", weight: 10 },
  { label: "debugging", task: "debug_assistance", weight: 15 },
  { label: "capstone", task: "capstone_scoring", weight: 8 },
  { label: "monetisation", task: "monetisation_planning", weight: 7 },
  { label: "proposal", task: "proposal_generation", weight: 8 },
  { label: "project review", task: "project_review", weight: 12 },
  { label: "evaluation", task: "ai_eval_judge", weight: 10 },
];

// ---- Deterministic PRNG (seeded, so runs are reproducible — not Math.random()) ----
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick(rng, items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Mock provider: never touches the real network ----
function createMockProvider({ rng, failureRate, timeoutRate, minLatencyMs, maxLatencyMs, timeoutMs }) {
  let calls = 0;
  return {
    getCallCount: () => calls,
    async chatCompletion() {
      calls++;
      const latency = minLatencyMs + rng() * (maxLatencyMs - minLatencyMs);
      if (rng() < timeoutRate) {
        await sleep(timeoutMs + 500); // exceeds the caller's own timeout -> AbortError
        const err = new Error("Simulated timeout");
        err.name = "AbortError";
        throw err;
      }
      await sleep(latency);
      if (rng() < failureRate) {
        const status = rng() < 0.5 ? 429 : 503;
        const err = new Error(`Simulated provider error ${status}`);
        err.status = status;
        throw err;
      }
      return { content: "mock response", inputTokens: 200, outputTokens: 150 };
    },
  };
}

// ---- Governor: faithful mirror of callAI()'s gating + retry + circuit-breaker logic ----
function createGovernor(provider) {
  let inFlightCount = 0;
  const inFlightByUser = new Map();
  const inFlightRequests = new Map();
  const responseCache = new Map();
  const dailyUsageByUser = new Map();
  let consecutiveFailures = 0;
  let circuitOpenedAt = null;

  const metrics = {
    requests: 0, successes: 0, failures: 0, timeouts: 0, retries: 0, deduped: 0, cacheHits: 0,
    circuitTrips: 0, circuitRejections: 0, concurrencyRejections: 0, perUserConcurrencyRejections: 0,
    dailyBudgetRejections: 0, latenciesMs: [], providerCallsAttempted: 0,
  };

  function priorityCeiling(priority) {
    return Math.max(1, Math.floor(MAX_CONCURRENT_REQUESTS * PRIORITY_CONCURRENCY_RATIO[priority]));
  }

  function todayUtc() {
    return new Date().toISOString().slice(0, 10);
  }

  function isRetryable(err) {
    if (err.status === 429) return true;
    if (err.status && err.status >= 500) return true;
    if (err.name === "AbortError") return true;
    return false;
  }

  async function executeWithRetry(task, config) {
    let lastError;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      if (attempt > 0) {
        metrics.retries++;
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000);
        const jitter = Math.random() * 300; // timing jitter only — not used for report determinism
        await sleep(backoff + jitter);
      }
      try {
        metrics.providerCallsAttempted++;
        return await provider.chatCompletion();
      } catch (err) {
        lastError = err;
        if (err.name === "AbortError") metrics.timeouts++;
        if (!isRetryable(err) || attempt === config.maxRetries) break;
      }
    }
    throw lastError;
  }

  async function call({ userId, task, cacheKey, cacheable }) {
    metrics.requests++;
    const config = TASK_CONFIG[task] ?? { timeoutMs: 20_000, maxRetries: 2, cacheTtlMs: 0 };
    const priority = TASK_PRIORITY[task] ?? "P2";

    if (cacheable && config.cacheTtlMs > 0) {
      const cached = responseCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        metrics.cacheHits++;
        metrics.successes++;
        return { ok: true, cacheHit: true };
      }
    }

    const existingInFlight = inFlightRequests.get(cacheKey);
    if (existingInFlight) {
      metrics.deduped++;
      metrics.successes++;
      await existingInFlight.catch(() => {});
      return { ok: true, deduped: true };
    }

    if (inFlightCount >= priorityCeiling(priority)) {
      metrics.concurrencyRejections++;
      metrics.failures++;
      return { ok: false, reason: "concurrency" };
    }
    if ((inFlightByUser.get(userId) ?? 0) >= MAX_CONCURRENT_PER_USER) {
      metrics.perUserConcurrencyRejections++;
      metrics.failures++;
      return { ok: false, reason: "per_user_concurrency" };
    }
    const dailyEntry = dailyUsageByUser.get(userId);
    const today = todayUtc();
    if (dailyEntry && dailyEntry.date === today && dailyEntry.count >= DAILY_CALLS_PER_USER) {
      metrics.dailyBudgetRejections++;
      metrics.failures++;
      return { ok: false, reason: "daily_budget" };
    }
    if (circuitOpenedAt !== null && Date.now() - circuitOpenedAt < CIRCUIT_COOLDOWN_MS) {
      metrics.circuitRejections++;
      metrics.failures++;
      return { ok: false, reason: "circuit_open" };
    }

    const startedAt = Date.now();
    inFlightCount++;
    inFlightByUser.set(userId, (inFlightByUser.get(userId) ?? 0) + 1);
    if (!dailyEntry || dailyEntry.date !== today) dailyUsageByUser.set(userId, { date: today, count: 1 });
    else dailyEntry.count++;

    const run = (async () => {
      try {
        const result = await executeWithRetry(task, config);
        consecutiveFailures = 0;
        circuitOpenedAt = null;
        metrics.latenciesMs.push(Date.now() - startedAt);
        metrics.successes++;
        if (cacheable && config.cacheTtlMs > 0) {
          responseCache.set(cacheKey, { value: result, expiresAt: Date.now() + config.cacheTtlMs });
        }
        return { ok: true };
      } catch {
        consecutiveFailures++;
        if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
          if (circuitOpenedAt === null) metrics.circuitTrips++;
          circuitOpenedAt = Date.now();
        }
        metrics.latenciesMs.push(Date.now() - startedAt);
        metrics.failures++;
        return { ok: false, reason: "provider_error" };
      } finally {
        inFlightCount--;
        const remaining = (inFlightByUser.get(userId) ?? 1) - 1;
        if (remaining <= 0) inFlightByUser.delete(userId);
        else inFlightByUser.set(userId, remaining);
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, run);
    return run;
  }

  return { call, metrics };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function runLevel(userCount, { rng, failureRate = 0.05, timeoutRate = 0.01 } = {}) {
  const provider = createMockProvider({
    rng, failureRate, timeoutRate, minLatencyMs: 150, maxLatencyMs: 1800, timeoutMs: 20_000,
  });
  const { call, metrics } = createGovernor(provider);

  const startedAt = Date.now();
  const tasks = [];
  for (let i = 0; i < userCount; i++) {
    const userId = `sim-user-${i}`;
    const type = weightedPick(rng, REQUEST_TYPES);
    // ~12% of requests reuse the exact same message as another user, to exercise dedup.
    const sharedKey = rng() < 0.12 ? `shared:${type.task}:${Math.floor(i / 6)}` : `unique:${type.task}:${i}`;
    tasks.push(call({ userId, task: type.task, cacheKey: sharedKey, cacheable: type.task === "lesson_explanation" }));
  }
  await Promise.all(tasks);
  const wallClockMs = Date.now() - startedAt;

  const sorted = [...metrics.latenciesMs].sort((a, b) => a - b);
  const avg = sorted.length ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;

  return {
    simulatedUsers: userCount,
    wallClockMs,
    requests: metrics.requests,
    successes: metrics.successes,
    failures: metrics.failures,
    timeouts: metrics.timeouts,
    retries: metrics.retries,
    deduped: metrics.deduped,
    cacheHits: metrics.cacheHits,
    circuitTrips: metrics.circuitTrips,
    concurrencyRejections: metrics.concurrencyRejections,
    perUserConcurrencyRejections: metrics.perUserConcurrencyRejections,
    dailyBudgetRejections: metrics.dailyBudgetRejections,
    avgLatencyMs: avg,
    p95LatencyMs: percentile(sorted, 95),
    maxLatencyMs: sorted.length ? sorted[sorted.length - 1] : 0,
    estimatedRealProviderCalls: metrics.providerCallsAttempted,
    requestStormRatio: Number((metrics.providerCallsAttempted / userCount).toFixed(2)),
  };
}

async function main() {
  const rng = mulberry32(42); // fixed seed -> reproducible report
  const levels = [1, 10, 25, 50, 100, 200];
  const results = [];
  for (const level of levels) {
    // eslint-disable-next-line no-console
    console.error(`Running ${level} simulated users...`);
    const result = await runLevel(level, { rng, failureRate: 0.05, timeoutRate: 0.01 });
    results.push(result);
  }

  // A dedicated high-failure-rate run at 50 users, specifically to prove the circuit breaker trips
  // and then requests fail fast instead of each paying the full retry/timeout cost.
  console.error("Running 50-user outage-simulation run (60% failure rate)...");
  const outageResult = await runLevel(50, { rng, failureRate: 0.6, timeoutRate: 0.02 });

  const report = {
    generatedBy: "scripts/load-test-ai-router.mjs",
    note: "Mock-provider simulation mirroring src/lib/ai/router.ts's governor logic. Never called the real Cerebras API.",
    levels: results,
    outageSimulation: { failureRate: 0.6, ...outageResult },
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
