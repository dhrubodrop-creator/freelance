"use client";

import { useState } from "react";
import Link from "next/link";

type DomainOption = "sales_ops" | "finance_hr" | "product_consulting" | "developer_data" | "other";
type ExperienceOption = "beginner" | "nocode" | "intermediate_code" | "advanced_dev";
type TimeOption = "low" | "medium" | "high";

export function ReadinessCalculator() {
  const [domain, setDomain] = useState<DomainOption>("sales_ops");
  const [experience, setExperience] = useState<ExperienceOption>("nocode");
  const [hours, setHours] = useState<TimeOption>("medium");
  const [submitted, setSubmitted] = useState(false);

  // Compute score deterministically
  const domainScoreMap: Record<DomainOption, number> = {
    sales_ops: 25,
    finance_hr: 25,
    product_consulting: 30,
    developer_data: 35,
    other: 20,
  };
  const expScoreMap: Record<ExperienceOption, number> = {
    beginner: 15,
    nocode: 25,
    intermediate_code: 35,
    advanced_dev: 45,
  };
  const timeScoreMap: Record<TimeOption, number> = {
    low: 10,
    medium: 15,
    high: 20,
  };

  const score = domainScoreMap[domain] + expScoreMap[experience] + timeScoreMap[hours];

  const getRecommendation = () => {
    if (experience === "beginner" || experience === "nocode") {
      return {
        track: "No-Code AI Automation & RAG Systems",
        project: "Lead Qualification & Account Research Workflow",
        courseSlug: "ai-agents-with-n8n-no-code",
        tools: ["n8n", "OpenAI / Claude API", "Google Sheets / Webhooks"],
        deliverable: "Automated process map, exception handler, and verified handover document."
      };
    }
    if (experience === "intermediate_code") {
      return {
        track: "Agentic AI Systems & RAG Engineering",
        project: "Cited Document Assistant with Vector Retrieval",
        courseSlug: "agentic-ai",
        tools: ["LangChain", "Pinecone / Qdrant", "FastAPI / Next.js"],
        deliverable: "Grounding evaluation harness, citation checker, and red-team test suite."
      };
    }
    return {
      track: "Production AI Engineering & MLOps",
      project: "Full-Stack Production Model & Evaluation Pipeline",
      courseSlug: "mlops-machine-learning-operations",
      tools: ["MLflow", "Docker", "FastAPI", "GitHub Actions"],
      deliverable: "Containerized model endpoint, automated retrain pipeline, and latency/cost dashboard."
    };
  };

  const rec = getRecommendation();

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
          {/* Domain Background */}
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              1. What is your primary professional background?
            </label>
            <p className="text-xs text-slate-400">Your domain knowledge is your primary advantage when building AI systems.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { id: "sales_ops", label: "Sales, Operations & Logistics" },
                { id: "finance_hr", label: "Finance, Accounting & HR" },
                { id: "product_consulting", label: "Product, Project & Consulting" },
                { id: "developer_data", label: "Software Engineering & Data" },
                { id: "other", label: "General Business / Transitioning" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDomain(item.id as DomainOption)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    domain === item.id
                      ? "border-sky-500 bg-sky-950/40 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Technical Experience */}
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              2. What is your current technical comfort level?
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                { id: "beginner", label: "Non-Technical (Excel, Word, Basic Apps)", desc: "No coding experience" },
                { id: "nocode", label: "No-Code Practitioner (Zapier, Make, n8n)", desc: "Comfortable with workflows & webhooks" },
                { id: "intermediate_code", label: "Low-Code / Scripting (Python, JS, SQL)", desc: "Can modify code and run APIs" },
                { id: "advanced_dev", label: "Experienced Software Engineer", desc: "Builds full-stack production systems" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExperience(item.id as ExperienceOption)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                    experience === item.id
                      ? "border-sky-500 bg-sky-950/40 text-white font-medium"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hours Available */}
          <div>
            <label className="block text-sm font-semibold text-slate-200">
              3. How many hours per week can you dedicate to building?
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { id: "low", label: "2–4 Hours / Week", desc: "Focused weekend sessions" },
                { id: "medium", label: "5–8 Hours / Week", desc: "Steady progress" },
                { id: "high", label: "10+ Hours / Week", desc: "Fast-track build cadence" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHours(item.id as TimeOption)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                    hours === item.id
                      ? "border-sky-500 bg-sky-950/40 text-white font-medium"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:from-sky-500 hover:to-blue-500"
          >
            Calculate My AI Readiness Score & Blueprint →
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Result Score Header */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/40 p-6 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-400">Your AI Readiness Score</div>
            <div className="mt-2 text-5xl font-extrabold text-white sm:text-6xl">{score} <span className="text-2xl font-semibold text-slate-400">/ 100</span></div>
            <p className="mt-3 text-sm text-slate-300">
              {score >= 75
                ? "Excellent baseline! You possess strong technical or domain foundation to build production-grade AI systems."
                : score >= 50
                ? "Solid readiness! Your background allows you to build high-value no-code automation & RAG systems immediately."
                : "Great starting point! We recommend starting with process mapping and no-code workflows before advanced engineering."}
            </p>
          </div>

          {/* Recommended Blueprint */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <h3 className="text-lg font-bold text-white">Recommended AI Build Blueprint</h3>
            
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400">Target Track:</span>
                <div className="text-sm font-medium text-sky-400">{rec.track}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400">Recommended First Project:</span>
                <div className="text-sm font-medium text-white">{rec.project}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400">Recommended Tools:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {rec.tools.map((t) => (
                    <span key={t} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400">Key Deliverable:</span>
                <div className="text-xs text-slate-300">{rec.deliverable}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/courses/${rec.courseSlug}`}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
              >
                View Recommended Course →
              </Link>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Recalculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
