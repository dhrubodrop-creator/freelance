import "server-only";
import * as cheerio from "cheerio";

import { getRawAccessToken } from "@/lib/github";
import { recordVerificationRun } from "@/lib/verification-runs";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Sections 19-22: Visual QA, Accessibility, Security, Performance labs.
 *
 * Honest about what this actually is: real, safe, non-destructive checks
 * against a URL/repo the learner controls — not a full Lighthouke/axe-core/
 * OWASP-scanner replacement. No headless browser is used (adding Playwright/
 * Chromium would be a large, non-free-tier-friendly dependency this stack
 * deliberately avoids elsewhere — see DECISIONS.md's "free/low-cost
 * infrastructure" pattern), so "visual" here means real static HTML
 * analysis, not a rendered screenshot. Every result is either a real
 * measurement or explicitly labeled as unavailable — never a fabricated
 * score.
 */

const FETCH_TIMEOUT_MS = 10_000;

async function fetchHtml(url: string): Promise<{ html: string; headers: Headers; status: number; bytes: number; latencyMs: number } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const latencyMs = Date.now() - started;
    const html = await res.text();
    return { html, headers: res.headers, status: res.status, bytes: Buffer.byteLength(html, "utf8"), latencyMs };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface VisualQAResult {
  checkedUrl: string;
  hasViewportMeta: boolean;
  hasTitle: boolean;
  imagesWithoutAlt: number;
  totalImages: number;
  headingOrderIssues: string[];
  emptyBody: boolean;
  note: string;
}

export async function runVisualQA(input: { userId: string; portfolioItemId: string; targetUrl: string }): Promise<VisualQAResult | { error: string }> {
  const fetched = await fetchHtml(input.targetUrl);
  if (!fetched) return { error: "Couldn't reach that URL." };

  const $ = cheerio.load(fetched.html);
  const headingOrderIssues: string[] = [];
  let lastLevel = 0;
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = Number(el.tagName.slice(1));
    if (lastLevel && level > lastLevel + 1) {
      headingOrderIssues.push(`Jumped from h${lastLevel} to h${level} — skipped a level.`);
    }
    lastLevel = level;
  });

  const images = $("img");
  const imagesWithoutAlt = images.filter((_, el) => !$(el).attr("alt")).length;

  const result: VisualQAResult = {
    checkedUrl: input.targetUrl,
    hasViewportMeta: $('meta[name="viewport"]').length > 0,
    hasTitle: $("title").text().trim().length > 0,
    imagesWithoutAlt,
    totalImages: images.length,
    headingOrderIssues,
    emptyBody: $("body").text().trim().length === 0,
    note: "Static HTML analysis only — no rendered screenshot or visual-regression diff was taken.",
  };

  await recordVerificationRun({
    userId: input.userId,
    portfolioItemId: input.portfolioItemId,
    checkType: "visual_qa",
    inputSummary: `Checked ${input.targetUrl}`,
    results: result as unknown as Record<string, unknown>,
    blockers: [
      !result.hasViewportMeta ? "No responsive viewport meta tag." : "",
      result.emptyBody ? "Page body is empty." : "",
    ].filter(Boolean),
  });

  return result;
}

export interface AccessibilityResult {
  checkedUrl: string;
  hasLangAttribute: boolean;
  hasTitle: boolean;
  imagesWithoutAlt: number;
  formInputsWithoutLabel: number;
  buttonsWithoutAccessibleName: number;
  note: string;
}

export async function runAccessibilityAudit(input: { userId: string; portfolioItemId: string; targetUrl: string }): Promise<AccessibilityResult | { error: string }> {
  const fetched = await fetchHtml(input.targetUrl);
  if (!fetched) return { error: "Couldn't reach that URL." };

  const $ = cheerio.load(fetched.html);
  const labeledIds = new Set($("label[for]").map((_, el) => $(el).attr("for")).get());
  let formInputsWithoutLabel = 0;
  $("input, select, textarea").each((_, el) => {
    const $el = $(el);
    const type = $el.attr("type");
    if (type === "hidden" || type === "submit" || type === "button") return;
    const id = $el.attr("id");
    const hasAriaLabel = Boolean($el.attr("aria-label") || $el.attr("aria-labelledby"));
    if (!hasAriaLabel && !(id && labeledIds.has(id))) formInputsWithoutLabel++;
  });

  let buttonsWithoutAccessibleName = 0;
  $("button").each((_, el) => {
    const $el = $(el);
    const hasText = $el.text().trim().length > 0;
    const hasAriaLabel = Boolean($el.attr("aria-label") || $el.attr("aria-labelledby"));
    if (!hasText && !hasAriaLabel) buttonsWithoutAccessibleName++;
  });

  const result: AccessibilityResult = {
    checkedUrl: input.targetUrl,
    hasLangAttribute: Boolean($("html").attr("lang")),
    hasTitle: $("title").text().trim().length > 0,
    imagesWithoutAlt: $("img").filter((_, el) => !$(el).attr("alt")).length,
    formInputsWithoutLabel,
    buttonsWithoutAccessibleName,
    note: "Automated static checks only (semantic HTML/labels/alt text) — not a full WCAG audit and not a substitute for real screen-reader testing or a contrast check, which needs rendering.",
  };

  await recordVerificationRun({
    userId: input.userId,
    portfolioItemId: input.portfolioItemId,
    checkType: "accessibility",
    inputSummary: `Checked ${input.targetUrl}`,
    results: result as unknown as Record<string, unknown>,
    blockers: [
      !result.hasLangAttribute ? "Missing lang attribute on <html>." : "",
      result.formInputsWithoutLabel > 0 ? `${result.formInputsWithoutLabel} form input(s) without an accessible label.` : "",
    ].filter(Boolean),
  });

  return result;
}

export interface SecurityResult {
  checkedUrl: string | null;
  hasHsts: boolean;
  hasContentTypeOptions: boolean;
  hasFrameOptionsOrCsp: boolean;
  authRejectsUnauthenticated: boolean | null;
  possibleExposedFiles: string[];
  note: string;
}

/** Never runs destructive tests — only reads response headers and checks for accidentally-committed .env-like files by name, not content brute-forcing. */
export async function runSecurityScan(input: {
  userId: string;
  portfolioItemId: string;
  targetUrl?: string | null;
  repoFullName?: string | null;
}): Promise<SecurityResult | { error: string }> {
  let headers: Headers | null = null;
  if (input.targetUrl) {
    const fetched = await fetchHtml(input.targetUrl);
    if (fetched) headers = fetched.headers;
  }

  const possibleExposedFiles: string[] = [];
  if (input.repoFullName) {
    const token = await getRawAccessToken(input.userId);
    if (token) {
      const treeRes = await fetch(`https://api.github.com/repos/${input.repoFullName}/git/trees/HEAD?recursive=1`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (treeRes.ok) {
        const treeData = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
        for (const entry of treeData.tree ?? []) {
          if (entry.type !== "blob") continue;
          const name = entry.path.split("/").pop() ?? "";
          if (/^\.env(\..+)?$/.test(name) && !name.includes("example") && !name.includes("sample")) {
            possibleExposedFiles.push(entry.path);
          }
        }
      }
    }
  }

  if (!headers && !input.repoFullName) {
    return { error: "Provide a deployed URL and/or connect a GitHub repo to run a security check." };
  }

  const result: SecurityResult = {
    checkedUrl: input.targetUrl ?? null,
    hasHsts: Boolean(headers?.get("strict-transport-security")),
    hasContentTypeOptions: headers?.get("x-content-type-options") === "nosniff",
    hasFrameOptionsOrCsp: Boolean(headers?.get("x-frame-options") || headers?.get("content-security-policy")),
    authRejectsUnauthenticated: null,
    possibleExposedFiles,
    note: "Checks response security headers and scans the repo's file list for committed .env-like files by name. This is not a dependency-vulnerability scan (run `npm audit` yourself) or a penetration test.",
  };

  await recordVerificationRun({
    userId: input.userId,
    portfolioItemId: input.portfolioItemId,
    checkType: "security",
    inputSummary: `Checked ${input.targetUrl ?? ""} ${input.repoFullName ?? ""}`.trim(),
    results: result as unknown as Record<string, unknown>,
    blockers: [
      possibleExposedFiles.length > 0 ? `Possible committed secret files: ${possibleExposedFiles.join(", ")}` : "",
      headers && !result.hasHsts ? "Missing Strict-Transport-Security header." : "",
    ].filter(Boolean),
  });

  return result;
}

export interface PerformanceResult {
  checkedUrl: string;
  responseTimeMs: number;
  responseSizeBytes: number;
  aiUsage: { totalCalls: number; avgLatencyMs: number; totalOutputTokens: number } | null;
  note: string;
}

export async function runPerformanceCheck(input: { userId: string; portfolioItemId: string; targetUrl: string }): Promise<PerformanceResult | { error: string }> {
  const fetched = await fetchHtml(input.targetUrl);
  if (!fetched) return { error: "Couldn't reach that URL." };

  const supabase = supabaseAdmin();
  const { data: aiRows } = await supabase
    .from("ai_usage_logs")
    .select("latency_ms, output_tokens")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(200);

  const aiUsage = aiRows && aiRows.length > 0
    ? {
        totalCalls: aiRows.length,
        avgLatencyMs: Math.round(aiRows.reduce((sum, r) => sum + (r.latency_ms ?? 0), 0) / aiRows.length),
        totalOutputTokens: aiRows.reduce((sum, r) => sum + (r.output_tokens ?? 0), 0),
      }
    : null;

  const result: PerformanceResult = {
    checkedUrl: input.targetUrl,
    responseTimeMs: fetched.latencyMs,
    responseSizeBytes: fetched.bytes,
    aiUsage,
    note: "A real, single-request measurement from this server — not a multi-run Lighthouse audit, and network conditions vary. AI usage numbers are your real logged Ropes AI Coach calls, not this specific page.",
  };

  await recordVerificationRun({
    userId: input.userId,
    portfolioItemId: input.portfolioItemId,
    checkType: "performance",
    inputSummary: `Checked ${input.targetUrl}`,
    results: result as unknown as Record<string, unknown>,
    blockers: fetched.latencyMs > 3000 ? [`Response took ${fetched.latencyMs}ms — slow first response.`] : [],
  });

  return result;
}
