import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { webPageJsonLd, organizationJsonLd } from "@/lib/seo/structured-data";
import { ProductionChecker } from "@/components/marketing/production-checker";

export const metadata: Metadata = pageMetadata({
  title: "Free AI Application Production Readiness Scan | Ropes",
  description: "Scan your AI app for production readiness across evaluation, threat modeling, human oversight, error handling, and performance latency budgets.",
  path: "/tools/production-readiness-checker",
  keywords: [
    "AI production readiness",
    "LLM evaluation checklist",
    "prompt injection scanner",
    "AI security audit",
    "AI app release checklist"
  ]
});

export default function ProductionReadinessCheckerPage() {
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools/production-readiness-checker" },
    { name: "Production Readiness Scan", path: "/tools/production-readiness-checker" }
  ]);
  const pageLd = webPageJsonLd({
    title: "Free AI Application Production Readiness Scan",
    description: "Scan your AI app for production readiness across evaluation, threat modeling, human oversight, and error handling.",
    path: "/tools/production-readiness-checker"
  });
  const orgLd = organizationJsonLd();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgLd) }} />

      <section className="relative border-b border-slate-800 bg-slate-900/50 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
            <span>Free Interactive Audit</span>
            <span className="text-slate-500">•</span>
            <span>Production Safety Checklist</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            AI Production Readiness Scan
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
            Verify whether your AI application, agent, or automation workflow is ready for real users across 5 critical engineering dimensions.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ProductionChecker />
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/30 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white">Why AI Production Readiness Matters</h2>
            <p className="text-slate-300">
              Unlike traditional software with deterministic pass/fail tests, AI systems exhibit probabilistic outputs, context window limits, prompt injection risks, and token cost escalation.
            </p>

            <div className="mt-10 rounded-2xl border border-purple-500/20 bg-purple-950/30 p-6 text-center">
              <h3 className="text-xl font-bold text-white">Master AI Testing, Security & MLOps on Ropes</h3>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link
                  href="/resources/skills/ai-testing"
                  className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
                >
                  Explore AI Testing Guide
                </Link>
                <Link
                  href="/resources/skills/ai-security"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Explore AI Security Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
