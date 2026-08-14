"use client";

import React, { useState } from "react";
import { Bot, FileCode, Award, Terminal } from "lucide-react";

export function InteractiveCoursePreview() {
  const [activeTab, setActiveTab] = useState<"mission" | "coach" | "workspace" | "proof">("mission");

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            Free Interactive Product Preview
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">Experience Ropes Before Enrolling</h2>
        </div>
        <p className="text-xs text-slate-400">No payment or credit card required.</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("mission")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "mission" ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <FileCode className="size-4" /> 1. Sample Mission
        </button>
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "coach" ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Bot className="size-4" /> 2. AI Coach Guidance
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "workspace" ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Terminal className="size-4" /> 3. Verification Lab
        </button>
        <button
          onClick={() => setActiveTab("proof")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === "proof" ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Award className="size-4" /> 4. Proof Profile Token
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "mission" && (
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-6 font-sans">
            <div className="flex items-center justify-between text-xs text-sky-400 font-mono">
              <span>MODULE 03 · RAG SYSTEM ARCHITECTURE</span>
              <span>EST. TIME: 45 MINS</span>
            </div>
            <h3 className="text-lg font-bold text-white">Mission: Implement Vector Embeddings & Similarity Search</h3>
            <p className="text-xs text-slate-300">
              In this mission, you will build a chunking pipeline using OpenAI embeddings and store vector representations in Supabase pgvector.
            </p>
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-300">
              <span className="text-emerald-400">✓ Step 1:</span> Parse PDF document into 500-token chunks<br />
              <span className="text-emerald-400">✓ Step 2:</span> Generate text-embedding-3-small vectors<br />
              <span className="text-amber-400">➔ Step 3:</span> Execute match_documents SQL similarity function
            </div>
          </div>
        )}

        {activeTab === "coach" && (
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-6 font-sans">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                <Bot className="size-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Ropes AI Mentor</span>
                <span className="ml-2 text-micro text-slate-400">Active Guidance</span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-200">
              &quot;I noticed your similarity query returned low relevance scores on table data. In financial documents, tables require structural preserve chunking instead of raw sentence splitting. Let&apos;s update your chunking function to preserve markdown tables!&quot;
            </div>
          </div>
        )}

        {activeTab === "workspace" && (
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-6 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>AUTOMATED QUALITY LAB RUN #402</span>
              <span className="text-emerald-400">PASS (100%)</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div>[TEST 1] Chunk overlap validation .......... <span className="text-emerald-400">PASSED</span></div>
              <div>[TEST 2] PGVector Index query latency ..... <span className="text-emerald-400">PASSED (42ms &lt; 100ms)</span></div>
              <div>[TEST 3] Prompt injection threat check ... <span className="text-emerald-400">PASSED</span></div>
              <div>[TEST 4] Token cost per query .......... <span className="text-emerald-400">PASSED ($0.0012)</span></div>
            </div>
          </div>
        )}

        {activeTab === "proof" && (
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">IMMUTABLE PROOF PROFILE EVIDENCE</span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-micro font-mono text-emerald-300">
                TOKEN: prf_live_demo_9841
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Verified AI Automation Engineer Portfolio Record</h3>
            <p className="text-xs text-slate-300">
              This proof token links directly to your public evidence profile showing verified code commits, test replay runs, and architecture diagrams for prospective clients.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
