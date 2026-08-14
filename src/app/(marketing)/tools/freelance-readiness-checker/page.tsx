import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, breadcrumbJsonLd, safeJsonLd } from "@/lib/seo";
import { webPageJsonLd, organizationJsonLd } from "@/lib/seo/structured-data";
import { FreelanceChecker } from "@/components/marketing/freelance-checker";

export const metadata: Metadata = pageMetadata({
  title: "Free AI Freelance Service & Offer Readiness Checker | Ropes",
  description: "Evaluate your readiness to sell AI automation, RAG, and AI implementation services to real clients. Get a tailored offer structure, pricing matrix, and deliverable checklist.",
  path: "/tools/freelance-readiness-checker",
  keywords: [
    "AI freelancing readiness",
    "AI service offer calculator",
    "AI automation pricing",
    "freelance AI service structure",
    "AI consulting checklist"
  ]
});

export default function FreelanceReadinessCheckerPage() {
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools/freelance-readiness-checker" },
    { name: "Freelance Readiness Checker", path: "/tools/freelance-readiness-checker" }
  ]);
  const pageLd = webPageJsonLd({
    title: "Free AI Freelance Service & Offer Readiness Checker",
    description: "Evaluate your readiness to sell AI automation, RAG, and AI implementation services to real clients.",
    path: "/tools/freelance-readiness-checker"
  });
  const orgLd = organizationJsonLd();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgLd) }} />

      <section className="relative border-b border-slate-800 bg-slate-900/50 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span>Free Interactive Tool</span>
            <span className="text-slate-500">•</span>
            <span>Client Delivery Focus</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            AI Freelance Offer & Service Readiness Checker
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
            Turn your technical or domain skill into a productized AI service with a defined scope, pricing recommendation, and client delivery checklist.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <FreelanceChecker />
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/30 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white">What Makes an AI Freelance Offer Credible?</h2>
            <p className="text-slate-300">
              Clients do not buy &quot;AI models&quot; or &quot;generic prompt engineering&quot;. They buy a clear business outcome with low risk, transparent pricing, and predictable delivery.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-base font-bold text-emerald-400">Bounded Scope & SLA</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Specify exact triggers, data sources, human review gates, and exception paths before making promises.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-base font-bold text-sky-400">Inspectable Evidence</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Provide a demo brief, architecture diagram, decision log, and test results rather than simple code snippets.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-6 text-center">
              <h3 className="text-xl font-bold text-white">Learn to package and deliver AI services with Ropes</h3>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link
                  href="/ai-freelancing"
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Read AI Freelancing Guide
                </Link>
                <Link
                  href="/turn-skills-into-freelance-services"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Turn Skills Into Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
