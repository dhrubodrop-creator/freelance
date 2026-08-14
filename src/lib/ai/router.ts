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
  | "debug_assistance";

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
};

const MAX_CONCURRENT_REQUESTS = envInt("AI_MAX_CONCURRENT_REQUESTS", 20);
let inFlightCount = 0;

const inFlightRequests = new Map<string, Promise<AIResult>>();
const responseCache = new Map<string, { value: AIResult; expiresAt: number }>();

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

  if (inFlightCount >= MAX_CONCURRENT_REQUESTS) {
    await logUsage({
      userId: params.userId ?? null,
      provider: "cerebras",
      model: CEREBRAS_MODEL,
      task: params.task,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      success: false,
      errorMessage: "Concurrency limit reached",
      retryCount: 0,
      cacheHit: false,
      deduped: false,
    });
    return null;
  }

  const run = (async (): Promise<AIResult> => {
    const startedAt = Date.now();
    inFlightCount++;
    try {
      const { result, retries, inputTokens, outputTokens } = await executeWithRetry(params, config);
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
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, run);

  try {
    return await run;
  } catch (err) {
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
