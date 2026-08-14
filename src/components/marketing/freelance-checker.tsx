"use client";

import { useState } from "react";
import Link from "next/link";

type ServiceType = "automation" | "rag_knowledge" | "ai_testing" | "consulting";
type TargetClient = "small_biz" | "mid_market" | "agency" | "startup";

export function FreelanceChecker() {
  const [service, setService] = useState<ServiceType>("automation");
  const [client, setClient] = useState<TargetClient>("small_biz");
  const [submitted, setSubmitted] = useState(false);

  const getServiceBlueprint = () => {
    switch (service) {
      case "automation":
        return {
          title: "AI Lead Operations & Workflow Automation Service",
          pricing: client === "mid_market" ? "$1,500 – $4,500 per project" : "$500 – $1,500 per project",
          deliverables: [
            "Workflow specification & data mapping diagram",
            "n8n / webhook automation configuration",
            "Human approval & exception notification setup",
            "Client handover runbook & video walkthrough"
          ],
          recommendedCourse: "ai-agents-with-n8n-no-code"
        };
      case "rag_knowledge":
        return {
          title: "Grounded Internal Knowledge Assistant Service",
          pricing: client === "mid_market" ? "$2,500 – $6,000 per project" : "$1,000 – $2,500 per project",
          deliverables: [
            "Vector database & document parsing setup",
            "Citation-enforced retrieval pipeline",
            "Accuracy test suite with 25+ benchmark queries",
            "Access permission & data privacy handover"
          ],
          recommendedCourse: "agentic-ai-development-with-langchain-langgraph"
        };
      case "ai_testing":
        return {
          title: "LLM Quality Evaluation & Regression Suite Service",
          pricing: client === "startup" ? "$2,000 – $5,000 per project" : "$1,500 – $3,500 per project",
          deliverables: [
            "Golden dataset curation (50+ realistic edge cases)",
            "Prompt regression evaluation harness",
            "Hallucination & safety scoring matrix",
            "CI/CD release gate integration guide"
          ],
          recommendedCourse: "ai-llm-testing"
        };
      default:
        return {
          title: "AI Opportunity Audit & Implementation Blueprint Service",
          pricing: client === "mid_market" ? "$2,000 – $5,000 per audit" : "$800 – $2,000 per audit",
          deliverables: [
            "Process bottleneck inventory",
            "AI feasibility & risk assessment matrix",
            "Tool selection & data privacy recommendations",
            "Step-by-step 90-day implementation roadmap"
          ],
          recommendedCourse: "ai-product-management"
        };
    }
  };

  const blueprint = getServiceBlueprint();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
      {!submitted ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              1. Which AI capability do you want to offer as a service?
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { id: "automation", title: "Workflow & Process Automation", desc: "n8n, lead ops, reporting pipelines" },
                { id: "rag_knowledge", title: "Knowledge & RAG Assistants", desc: "SOP search, policy & document Q&A" },
                { id: "ai_testing", title: "AI Testing & LLM Evaluation", desc: "Golden datasets, prompt regression, safety" },
                { id: "consulting", title: "AI Product & Opportunity Audits", desc: "Workflow discovery, PRDs, roadmaps" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setService(item.id as ServiceType)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    service === item.id
                      ? "border-emerald-500 bg-emerald-950/40 text-white font-medium"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200">
              2. Who is your primary target buyer?
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { id: "small_biz", title: "Small Local / Service Businesses", desc: "Needs immediate process relief" },
                { id: "mid_market", title: "Mid-Market Organizations", desc: "Higher budget, requires security & docs" },
                { id: "agency", title: "Digital & Marketing Agencies", desc: "Wants white-label automation systems" },
                { id: "startup", title: "AI & Tech Startups", desc: "Needs evaluation suites & production checks" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setClient(item.id as TargetClient)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    client === item.id
                      ? "border-emerald-500 bg-emerald-950/40 text-white font-medium"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:from-emerald-500 hover:to-teal-500"
          >
            Generate My Freelance Service Blueprint →
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tailored Service Blueprint</div>
            <h3 className="mt-1 text-2xl font-extrabold text-white">{blueprint.title}</h3>
            
            <div className="mt-4 rounded-lg bg-slate-950/60 p-4">
              <span className="text-xs font-semibold text-slate-400">Suggested Project Pricing:</span>
              <div className="mt-1 text-xl font-bold text-emerald-400">{blueprint.pricing}</div>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-bold text-slate-200">Recommended Deliverables:</h4>
              <ul className="mt-2 space-y-2 text-xs text-slate-300">
                {blueprint.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/courses/${blueprint.recommendedCourse}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
              >
                Learn How to Build & Deliver This →
              </Link>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Change Options
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
