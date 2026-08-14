import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { webPageJsonLd, organizationJsonLd } from "@/lib/seo/structured-data";
import { ReadinessCalculator } from "@/components/marketing/readiness-calculator";

export const metadata: Metadata = pageMetadata({
  title: "Free AI Project & Skill Readiness Checker | Ropes",
  description: "Calculate your AI Project Readiness Score (0-100) based on your domain background, technical experience, and weekly hours. Get a personalized project blueprint.",
  path: "/tools/ai-readiness-checker",
  keywords: [
    "AI readiness checker",
    "AI project evaluation",
    "AI skill gap tool",
    "free AI diagnostic",
    "AI learning path",
    "non-technical AI path"
  ]
});

export default function AIReadinessCheckerPage() {
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools/ai-readiness-checker" },
    { name: "AI Readiness Checker", path: "/tools/ai-readiness-checker" }
  ]);
  const pageLd = webPageJsonLd({
    title: "Free AI Project & Skill Readiness Checker",
    description: "Calculate your AI Project Readiness Score (0-100) based on your domain background, technical experience, and weekly hours.",
    path: "/tools/ai-readiness-checker"
  });
  const orgLd = organizationJsonLd();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgLd) }} />

      {/* Hero Header */}
      <section className="relative border-b border-slate-800 bg-slate-900/50 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            <span>Free Interactive Tool</span>
            <span className="text-slate-500">•</span>
            <span>No Signup Required</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            AI Project & Skill Readiness Checker
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
            Find out what realistic AI project you can build based on your domain expertise, technical comfort, and weekly available hours.
          </p>
        </div>
      </section>

      {/* Main Interactive Tool */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ReadinessCalculator />
        </div>
      </section>

      {/* Explanatory Content for Search & AI Engines */}
      <section className="border-t border-slate-800 bg-slate-900/30 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white">How Ropes Measures AI Project Readiness</h2>
            <p className="text-slate-300">
              Unlike generic online quizzes that ask superficial questions, Ropes evaluates your readiness across three practical dimensions:
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-semibold text-sky-400">1. Domain Expertise</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Your background in sales, operations, finance, HR, product, or software is your strongest starting asset. Understanding workflow exceptions matters more than memorizing prompt keywords.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-semibold text-emerald-400">2. Technical Depth</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Whether you use no-code n8n workflows or full-stack Python/Next.js systems, matching system complexity to your current comfort level prevents project abandonment.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-semibold text-purple-400">3. Time & Focus Budget</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Completing a small, fully verified build in 4 hours per week is significantly more valuable than starting an overly ambitious system that never reaches a working demo.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-sky-500/20 bg-sky-950/30 p-6 text-center">
              <h3 className="text-xl font-bold text-white">Ready to build and verify your AI project?</h3>
              <p className="mt-2 text-sm text-slate-300">
                Explore Ropes&apos; structured learning tracks, hands-on capstones, and immutable proof evidence engine.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link
                  href="/courses"
                  className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Explore Ropes Courses
                </Link>
                <Link
                  href="/resources/projects"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  View Sample Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
