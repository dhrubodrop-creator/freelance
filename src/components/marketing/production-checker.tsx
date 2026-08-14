"use client";

import { useState } from "react";
import Link from "next/link";

interface CheckItem {
  id: string;
  category: string;
  title: string;
  desc: string;
}

const CHECK_ITEMS: CheckItem[] = [
  { id: "golden_dataset", category: "Evaluation & Benchmarks", title: "Golden Evaluation Dataset", desc: "You have a benchmark set of 25+ realistic inputs with expected baseline outputs." },
  { id: "prompt_regression", category: "Evaluation & Benchmarks", title: "Automated Prompt Regression", desc: "Prompt or model parameter updates are tested against regression criteria before release." },
  { id: "prompt_injection", category: "Security & Threat Review", title: "Prompt Injection Controls", desc: "Untrusted user or document inputs are sanitized and isolated from system instructions." },
  { id: "least_privilege", category: "Security & Threat Review", title: "Least-Privilege Tool Access", desc: "AI agents cannot execute destructive database or API commands without explicit permission boundaries." },
  { id: "human_review", category: "Oversight & Safeguards", title: "Human Oversight Gate", desc: "Irreversible actions (payments, sensitive emails, data deletes) require human approval." },
  { id: "fallback_handler", category: "Error & Failure Handling", title: "Non-AI Fallback Handler", desc: "System gracefully handles API rate limits, model downtime, or timeout errors." },
  { id: "cost_latency", category: "Performance & Monitoring", title: "Token Cost & Latency Budget", desc: "Maximum token usage limits, streaming response thresholds, and cost alerts are configured." }
];

export function ProductionChecker() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const count = Object.values(checked).filter(Boolean).length;
  const score = Math.round((count / CHECK_ITEMS.length) * 100);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Production Readiness Assessment</h2>
          <p className="text-xs text-slate-400">Check each safeguard present in your AI application:</p>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Readiness Score</div>
          <div className="text-2xl font-extrabold text-white">{score}%</div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {CHECK_ITEMS.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                isChecked
                  ? "border-purple-500/50 bg-purple-950/20"
                  : "border-slate-800 bg-slate-950 hover:border-slate-700"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                  isChecked
                    ? "border-purple-500 bg-purple-600 text-white"
                    : "border-slate-700 bg-slate-900 text-transparent"
                }`}
              >
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-400">{item.category}:</span>
                  <span className="text-sm font-bold text-white">{item.title}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-6">
        <h3 className="text-base font-bold text-white">Scan Summary</h3>
        <p className="mt-1 text-xs text-slate-300">
          {score === 100
            ? "Outstanding! Your AI application meets production-grade safety, security, and evaluation standards."
            : score >= 50
            ? "Good baseline, but key safeguards remain. Focus on evaluation datasets and least-privilege security controls."
            : "High risk! Your AI application requires evaluation harnesses, threat review, and fallback handling before shipping."}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/resources/skills/ai-testing"
            className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-500"
          >
            Learn AI Testing & Evaluation →
          </Link>
          <Link
            href="/resources/skills/ai-security"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
          >
            Learn AI Security →
          </Link>
        </div>
      </div>
    </div>
  );
}
