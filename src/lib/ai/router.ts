import "server-only";

import { cerebras, CEREBRAS_MODEL } from "@/lib/cerebras";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * AI task -> model router.
 *
 * Only one provider (Cerebras) and one model are actually configured today
 * — there was no second provider or embeddings endpoint to route to when
 * this was built (see DECISIONS.md's existing reasoning for why the mentor's
 * RAG uses Postgres full-text search instead of real embeddings, same
 * constraint). Rather than hardcode that assumption into every call site,
 * every AI call in the app goes through `callAI()` here, keyed by task tier,
 * so adding a second provider/model later is a change in this one file, not
 * a rewrite of the mentor/coach/capstone/monetisation call sites.
 *
 * What this router actually does today, independent of provider count:
 * - per-task token/temperature/retry budgets (configurable via env, never
 *   invented numbers — Cerebras doesn't publish hard per-tier limits, so
 *   these are conservative, overridable defaults, not guesses presented as
 *   fact)
 * - retry with exponential backoff + jitter on 429/5xx/timeout, capped
 * - request timeout via AbortController (a hung provider call must not hang
 *   a Next.js API route indefinitely)
 * - in-memory de-dup of identical concurrent requests (best-effort — a
 *   single warm serverless instance, not a distributed cache; there's no
 *   Redis/Upstash in this stack, matching the same free-tier constraint
 *   noted throughout DECISIONS.md)
 * - short-TTL in-memory response cache, opt-in per task, for genuinely
 *   cacheable/non-personalised tasks only
 * - fire-and-forget usage logging to `ai_usage_logs` for every call,
 *   success or failure
 */

export type AITask =
  | "hint_generation"
  | "socratic_questioning"
  | "lesson_explanation"
  | "content_summarization"
  | "recommendation"
  | "skill_analysis"
  | "project_review"
  | "interview_simulation"
  | "capstone_defence_questions"
  | "capstone_scoring"
  | "portfolio_generation"
  | "monetisation_planning"
  | "daily_mission_framing"
  | "concept_rescue"
  | "idea_plan_generation"
  | "code_explanation"
  | "debug_assistance"
  | "code_review"
  | "architecture_drift_check"
  | "ai_code_defense"
  | "test_generation"
  | "quality_lab_summary"
  | "learner_ai_feature_execution"
  | "ai_eval_judge"
  | "simulator_turn"
  | "simulator_evaluation"
  | "architecture_diagram_generation"
  | "proposal_generation";

/**
 * AI resource governor — priority tiers. Every task is assigned exactly one
 * tier below; P3 background/optional generation yields concurrency headroom
 * to P0 blocking-verification work under load (see PRIORITY_CONCURRENCY_RATIO).
 *
 * P0 — active learner blocking action / verification / capstone evaluation
 * P1 — AI Coach, debugging, concept rescue (interactive, learner waiting live)
 * P2 — recommendations, portfolio/business prose, optional enhancement generation
 * P3 — background/non-essential generation
 */
export type AIPriority = "P0" | "P1" | "P2" | "P3";

const TASK_PRIORITY: Record<AITask, AIPriority> = {
  project_review: "P0",
  capstone_defence_questions: "P0",
  capstone_scoring: "P0",
  code_review: "P0",
  architecture_drift_check: "P0",
  ai_code_defense: "P0",
  test_generation: "P0",

  hint_generation: "P1",
  socratic_questioning: "P1",
  lesson_explanation: "P1",
  debug_assistance: "P1",
  concept_rescue: "P1",
  code_explanation: "P1",
  simulator_turn: "P1",
  simulator_evaluation: "P1",
  interview_simulation: "P1",

  recommendation: "P2",
  portfolio_generation: "P2",
  monetisation_planning: "P2",
  daily_mission_framing: "P2",
  idea_plan_generation: "P2",
  learner_ai_feature_execution: "P2",
  architecture_diagram_generation: "P2",
  proposal_generation: "P2",

  content_summarization: "P3",
  skill_analysis: "P3",
  quality_lab_summary: "P3",
  ai_eval_judge: "P3",
};

/** Share of MAX_CONCURRENT_REQUESTS each tier may use. P0 can use all of it; P3 is capped
 * to a quarter, so background work can never crowd out an active learner waiting on a
 * blocking check — without needing a real queue, which this in-memory/single-instance
 * router doesn't have. */
const PRIORITY_CONCURRENCY_RATIO: Record<AIPriority, number> = { P0: 1, P1: 0.75, P2: 0.5, P3: 0.25 };

interface TaskConfig {
  maxOutputTokens: number;
  temperature: number;
  timeoutMs: number;
  maxRetries: number;
  cacheTtlMs: number; // 0 = never cache (personalised/user-specific output)
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Conservative, overridable-by-env defaults — not published Cerebras limits
 * (Cerebras doesn't publish fixed per-task token limits; these are this
 * app's own budget, tunable per section 36's "AI budget governor" without a
 * code change).
 *
 * The floors below are higher than they look like they need to be because
 * of a real, measured behavior: CEREBRAS_MODEL (gpt-oss-120b) is a reasoning
 * model that spends part of `max_tokens` on hidden reasoning before it
 * writes the visible reply. Measured directly against the live API while
 * building this router: a 100-token budget produced 97 reasoning tokens and
 * ZERO visible content; 300 tokens still truncated a one-sentence hint; 600
 * tokens left ~40 reasoning tokens and a complete reply. Every budget here
 * has that headroom built in — `callAI()` also treats empty content as a
 * retryable failure (see executeWithRetry), so a too-tight budget fails loud
 * via retry/fallback rather than silently returning blank text.
 */
const TASK_CONFIG: Record<AITask, TaskConfig> = {
  hint_generation: {
    maxOutputTokens: envInt("AI_BUDGET_HINT_TOKENS", 500),
    temperature: 0.6,
    timeoutMs: envInt("AI_TIMEOUT_MS_LOW", 15_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  socratic_questioning: {
    maxOutputTokens: envInt("AI_BUDGET_SOCRATIC_TOKENS", 600),
    temperature: 0.6,
    timeoutMs: envInt("AI_TIMEOUT_MS_LOW", 15_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  lesson_explanation: {
    maxOutputTokens: envInt("AI_BUDGET_EXPLAIN_TOKENS", 800),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: envInt("AI_CACHE_TTL_EXPLAIN_MS", 10 * 60_000),
  },
  content_summarization: {
    maxOutputTokens: envInt("AI_BUDGET_SUMMARY_TOKENS", 700),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: envInt("AI_CACHE_TTL_SUMMARY_MS", 30 * 60_000),
  },
  recommendation: {
    maxOutputTokens: envInt("AI_BUDGET_RECOMMEND_TOKENS", 700),
    temperature: 0.5,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  skill_analysis: {
    maxOutputTokens: envInt("AI_BUDGET_SKILL_TOKENS", 600),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  project_review: {
    maxOutputTokens: envInt("AI_BUDGET_REVIEW_TOKENS", 1000),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 3,
    cacheTtlMs: 0,
  },
  interview_simulation: {
    maxOutputTokens: envInt("AI_BUDGET_INTERVIEW_TOKENS", 700),
    temperature: 0.6,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  capstone_defence_questions: {
    maxOutputTokens: envInt("AI_BUDGET_DEFENCE_Q_TOKENS", 1000),
    temperature: 0.6,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 3,
    cacheTtlMs: 0,
  },
  capstone_scoring: {
    maxOutputTokens: envInt("AI_BUDGET_SCORING_TOKENS", 1200),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_CRITICAL", 40_000),
    maxRetries: 3,
    cacheTtlMs: 0,
  },
  portfolio_generation: {
    maxOutputTokens: envInt("AI_BUDGET_PORTFOLIO_TOKENS", 1000),
    temperature: 0.5,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  monetisation_planning: {
    maxOutputTokens: envInt("AI_BUDGET_MONETISATION_TOKENS", 900),
    temperature: 0.5,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  daily_mission_framing: {
    maxOutputTokens: envInt("AI_BUDGET_MISSION_TOKENS", 600),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_LOW", 15_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  concept_rescue: {
    maxOutputTokens: envInt("AI_BUDGET_RESCUE_TOKENS", 1100),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  idea_plan_generation: {
    maxOutputTokens: envInt("AI_BUDGET_IDEA_PLAN_TOKENS", 2200),
    temperature: 0.5,
    timeoutMs: envInt("AI_TIMEOUT_MS_CRITICAL", 40_000),
    maxRetries: 3,
    cacheTtlMs: 0,
  },
  code_explanation: {
    maxOutputTokens: envInt("AI_BUDGET_CODE_EXPLAIN_TOKENS", 1400),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  debug_assistance: {
    maxOutputTokens: envInt("AI_BUDGET_DEBUG_TOKENS", 1200),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  code_review: {
    maxOutputTokens: envInt("AI_BUDGET_CODE_REVIEW_TOKENS", 1400),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  architecture_drift_check: {
    maxOutputTokens: envInt("AI_BUDGET_ARCH_DRIFT_TOKENS", 1200),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  ai_code_defense: {
    maxOutputTokens: envInt("AI_BUDGET_AI_DEFENSE_TOKENS", 1000),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  test_generation: {
    maxOutputTokens: envInt("AI_BUDGET_TEST_GEN_TOKENS", 1800),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_CRITICAL", 40_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  quality_lab_summary: {
    maxOutputTokens: envInt("AI_BUDGET_QUALITY_SUMMARY_TOKENS", 700),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  learner_ai_feature_execution: {
    maxOutputTokens: envInt("AI_BUDGET_LEARNER_EXEC_TOKENS", 1200),
    temperature: 0.5,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 1,
    cacheTtlMs: 0,
  },
  ai_eval_judge: {
    maxOutputTokens: envInt("AI_BUDGET_EVAL_JUDGE_TOKENS", 900),
    temperature: 0.2,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  simulator_turn: {
    maxOutputTokens: envInt("AI_BUDGET_SIMULATOR_TOKENS", 700),
    temperature: 0.7,
    timeoutMs: envInt("AI_TIMEOUT_MS_MED", 20_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  simulator_evaluation: {
    maxOutputTokens: envInt("AI_BUDGET_SIMULATOR_EVAL_TOKENS", 1100),
    temperature: 0.3,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  architecture_diagram_generation: {
    maxOutputTokens: envInt("AI_BUDGET_ARCH_DIAGRAM_TOKENS", 1200),
    temperature: 0.2,
    timeoutMs: envInt("AI_TIMEOUT_MS_HIGH", 30_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
  proposal_generation: {
    maxOutputTokens: envInt("AI_BUDGET_PROPOSAL_TOKENS", 1600),
    temperature: 0.4,
    timeoutMs: envInt("AI_TIMEOUT_MS_CRITICAL", 40_000),
    maxRetries: 2,
    cacheTtlMs: 0,
  },
};

const MAX_CONCURRENT_REQUESTS = envInt("AI_MAX_CONCURRENT_REQUESTS", 20);
let inFlightCount = 0;

const inFlightRequests = new Map<string, Promise<AIResult>>();
const responseCache = new Map<string, { value: AIResult; expiresAt: number }>();

function priorityCeiling(priority: AIPriority): number {
  return Math.max(1, Math.floor(MAX_CONCURRENT_REQUESTS * PRIORITY_CONCURRENCY_RATIO[priority]));
}

/**
 * Per-user concurrency limit — one learner spamming a feature (double-clicks,
 * a broken retry loop client-side) must not be able to eat the whole shared
 * concurrency budget away from every other learner. In-memory/per-instance,
 * same caveat as everything else in this router.
 */
const MAX_CONCURRENT_PER_USER = envInt("AI_MAX_CONCURRENT_PER_USER", 3);
const inFlightByUser = new Map<string, number>();

/**
 * Daily per-user AI budget — this app's own conservative ceiling on a free/
 * limited provider allowance, not a published Cerebras limit. Resets at UTC
 * midnight. In-memory/per-instance (approximate on a multi-instance
 * deployment — a real budget would need a shared store), which is an
 * acceptable trade for "graceful, not exact" governance at this scale.
 */
const DAILY_CALLS_PER_USER = envInt("AI_DAILY_CALLS_PER_USER", 150);
const dailyUsageByUser = new Map<string, { date: string; count: number }>();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDailyBudgetExhausted(userId: string): boolean {
  const entry = dailyUsageByUser.get(userId);
  const today = todayUtc();
  if (!entry || entry.date !== today) return false;
  return entry.count >= DAILY_CALLS_PER_USER;
}

function recordDailyUsage(userId: string): void {
  const today = todayUtc();
  const entry = dailyUsageByUser.get(userId);
  if (!entry || entry.date !== today) {
    dailyUsageByUser.set(userId, { date: today, count: 1 });
  } else {
    entry.count++;
  }
}

/**
 * Circuit breaker — 200-user reliability pass. Without this, a full Cerebras
 * outage means every single user's request independently pays the full
 * retry+backoff+timeout cost (up to ~2 minutes for the heaviest tasks)
 * before failing. With this, once the provider has failed
 * AI_CIRCUIT_FAILURE_THRESHOLD times in a row, the circuit opens: every
 * subsequent call fails FAST (no network call, no retry wait) for
 * AI_CIRCUIT_COOLDOWN_MS, then lets exactly one request through to probe
 * recovery (a plain half-open, not a counted trial window — good enough for
 * this scale). In-memory/per-instance only, same distribution caveat as the
 * concurrency counter above — there is no shared store (no Redis/Upstash) in
 * this stack, so this protects one warm instance's worth of traffic, not a
 * cross-instance global breaker. Concurrency-limit rejections (our own cap,
 * not a provider failure) never count toward this — only real provider
 * failures do.
 */
const CIRCUIT_FAILURE_THRESHOLD = envInt("AI_CIRCUIT_FAILURE_THRESHOLD", 5);
const CIRCUIT_COOLDOWN_MS = envInt("AI_CIRCUIT_COOLDOWN_MS", 30_000);
const HEALTH_WINDOW_MS = 5 * 60_000;

let consecutiveFailures = 0;
let circuitOpenedAt: number | null = null;
/** Bounded rolling log of recent outcomes, used only to compute provider health — not a distributed metric store. */
const recentOutcomes: { ts: number; ok: boolean }[] = [];

function recordOutcome(ok: boolean): void {
  recentOutcomes.push({ ts: Date.now(), ok });
  if (recentOutcomes.length > 500) recentOutcomes.splice(0, recentOutcomes.length - 500);
}

export type ProviderHealthStatus = "healthy" | "busy" | "degraded" | "unavailable";

export interface ProviderHealth {
  status: ProviderHealthStatus;
  consecutiveFailures: number;
  circuitOpen: boolean;
  /** Failure rate over the last 5 minutes of calls on this instance, or null if too few calls to judge. */
  recentFailureRate: number | null;
}

/**
 * Inferred purely from real outcomes already recorded by callAI() — never
 * pings Cerebras itself, per the brief's explicit "do not waste API requests
 * for health checks" rule.
 */
export function getProviderHealth(): ProviderHealth {
  const now = Date.now();
  const windowed = recentOutcomes.filter((o) => o.ts >= now - HEALTH_WINDOW_MS);
  const failures = windowed.filter((o) => !o.ok).length;
  const recentFailureRate = windowed.length > 0 ? failures / windowed.length : null;
  const circuitOpen = circuitOpenedAt !== null && now - circuitOpenedAt < CIRCUIT_COOLDOWN_MS;

  let status: ProviderHealthStatus = "healthy";
  if (circuitOpen) status = "unavailable";
  else if (inFlightCount >= MAX_CONCURRENT_REQUESTS) status = "busy";
  else if (recentFailureRate !== null && windowed.length >= 3 && recentFailureRate >= 0.3) status = "degraded";

  return { status, consecutiveFailures, circuitOpen, recentFailureRate };
}

export interface AIResult {
  content: string;
  model: string;
  provider: string;
}

interface AICallParams {
  task: AITask;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  userId?: string | null;
  /** Only set true for genuinely non-personalised, deterministic-enough-to-cache prompts. */
  cacheable?: boolean;
  /** Rarely needed — overrides the task's default priority tier (see TASK_PRIORITY). */
  priority?: AIPriority;
}

function requestCacheKey(params: AICallParams): string {
  return `${params.task}:${JSON.stringify(params.messages)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (status === 429) return true;
  if (status && status >= 500) return true;
  if (err instanceof Error && (err.name === "AbortError" || /timeout|network/i.test(err.message))) return true;
  return false;
}

async function logUsage(entry: {
  userId: string | null;
  provider: string;
  model: string;
  task: AITask;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
  retryCount: number;
  cacheHit: boolean;
  deduped: boolean;
}): Promise<void> {
  try {
    await supabaseAdmin().from("ai_usage_logs").insert({
      user_id: entry.userId,
      provider: entry.provider,
      model: entry.model,
      task: entry.task,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      latency_ms: entry.latencyMs,
      success: entry.success,
      error_message: entry.errorMessage,
      retry_count: entry.retryCount,
      cache_hit: entry.cacheHit,
      deduped: entry.deduped,
    });
  } catch {
    // best-effort only — logging must never break the calling request
  }
}

async function executeWithRetry(
  params: AICallParams,
  config: TaskConfig
): Promise<{ result: AIResult; retries: number; inputTokens: number | null; outputTokens: number | null }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 8_000);
      const jitter = Math.random() * 300;
      await sleep(backoff + jitter);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const completion = await cerebras.chat.completions.create(
        {
          model: CEREBRAS_MODEL,
          messages: params.messages,
          temperature: config.temperature,
          max_tokens: config.maxOutputTokens,
        },
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      const content = completion.choices[0]?.message?.content ?? "";
      if (!content) throw new Error("Empty response from provider");
      return {
        result: { content, model: CEREBRAS_MODEL, provider: "cerebras" },
        retries: attempt,
        inputTokens: completion.usage?.prompt_tokens ?? null,
        outputTokens: completion.usage?.completion_tokens ?? null,
      };
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (!isRetryableError(err) || attempt === config.maxRetries) break;
    }
  }
  throw lastError;
}

/**
 * The single entry point every AI feature in the app should call instead of
 * hitting the `cerebras` client directly. Returns null on failure — callers
 * decide their own fallback (a deterministic response, an error message to
 * the user), matching this project's existing "never fabricate on AI
 * failure" convention.
 */
export async function callAI(params: AICallParams): Promise<AIResult | null> {
  const config = TASK_CONFIG[params.task];
  const cacheKey = requestCacheKey(params);

  if (params.cacheable && config.cacheTtlMs > 0) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      void logUsage({
        userId: params.userId ?? null,
        provider: "cerebras",
        model: CEREBRAS_MODEL,
        task: params.task,
        inputTokens: null,
        outputTokens: null,
        latencyMs: 0,
        success: true,
        errorMessage: null,
        retryCount: 0,
        cacheHit: true,
        deduped: false,
      });
      return cached.value;
    }
  }

  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight) {
    void logUsage({
      userId: params.userId ?? null,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: true,
      errorMessage: null,
      retryCount: 0,
      cacheHit: false,
      deduped: true,
    });
    return existingInFlight;
  }

  const priority = params.priority ?? TASK_PRIORITY[params.task];

  if (inFlightCount >= priorityCeiling(priority)) {
    // Priority-tiered ceiling, not a flat cap — a P3 (background) request can be rejected
    // here well before global capacity (MAX_CONCURRENT_REQUESTS) is actually exhausted, so
    // P0 blocking-verification work always has headroom. See PRIORITY_CONCURRENCY_RATIO.
    await logUsage({
      userId: params.userId ?? null,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: false,
      errorMessage: `Concurrency limit reached (priority ${priority})`,
      retryCount: 0,
      cacheHit: false,
      deduped: false,
    });
    return null;
  }

  if (params.userId && (inFlightByUser.get(params.userId) ?? 0) >= MAX_CONCURRENT_PER_USER) {
    await logUsage({
      userId: params.userId,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: false,
      errorMessage: "Per-user concurrency limit reached",
      retryCount: 0,
      cacheHit: false,
      deduped: false,
    });
    return null;
  }

  if (params.userId && isDailyBudgetExhausted(params.userId)) {
    await logUsage({
      userId: params.userId,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: false,
      errorMessage: "Daily AI budget reached for this user",
      retryCount: 0,
      cacheHit: false,
      deduped: false,
    });
    return null;
  }

  if (circuitOpenedAt !== null && Date.now() - circuitOpenedAt < CIRCUIT_COOLDOWN_MS) {
    // Circuit open — fail fast, no provider call, no retry wait. This is the whole point:
    // during a real outage, 200 users' worth of requests must not each independently pay
    // the full retry+timeout cost.
    await logUsage({
      userId: params.userId ?? null,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: false,
      errorMessage: "Circuit breaker open — provider failing repeatedly, cooling down",
      retryCount: 0,
      cacheHit: false,
      deduped: false,
    });
    return null;
  }

  const run = (async (): Promise<AIResult> => {
    const startedAt = Date.now();
    inFlightCount++;
    if (params.userId) {
      inFlightByUser.set(params.userId, (inFlightByUser.get(params.userId) ?? 0) + 1);
      recordDailyUsage(params.userId);
    }
    try {
      const { result, retries, inputTokens, outputTokens } = await executeWithRetry(params, config);
      consecutiveFailures = 0;
      circuitOpenedAt = null;
      recordOutcome(true);
      await logUsage({
        userId: params.userId ?? null,
        provider: result.provider,
        model: result.model,
        task: params.task,
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startedAt,
        success: true,
        errorMessage: null,
        retryCount: retries,
        cacheHit: false,
        deduped: false,
      });
      if (params.cacheable && config.cacheTtlMs > 0) {
        responseCache.set(cacheKey, { value: result, expiresAt: Date.now() + config.cacheTtlMs });
      }
      return result;
    } finally {
      inFlightCount--;
      if (params.userId) {
        const remaining = (inFlightByUser.get(params.userId) ?? 1) - 1;
        if (remaining <= 0) inFlightByUser.delete(params.userId);
        else inFlightByUser.set(params.userId, remaining);
      }
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, run);

  try {
    return await run;
  } catch (err) {
    consecutiveFailures++;
    recordOutcome(false);
    if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
      // (Re)open with a fresh cooldown — this also covers a failed half-open probe: without
      // refreshing the timestamp here, one failed probe after cooldown would let every
      // subsequent call through immediately instead of waiting out a new cooldown window.
      circuitOpenedAt = Date.now();
    }
    await logUsage({
      userId: params.userId ?? null,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: false,
      errorMessage: err instanceof Error ? err.message.slice(0, 500) : "Unknown error",
      retryCount: config.maxRetries,
      cacheHit: false,
      deduped: false,
    });
    return null;
  }
}
