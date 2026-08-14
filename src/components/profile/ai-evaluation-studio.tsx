"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown, FlaskConical, Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { AiEvalResult } from "@/lib/ai-evaluation";

export function AiEvaluationStudio({ portfolioItemId }: { portfolioItemId: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [form, setForm] = React.useState({ featureName: "", systemPrompt: "", testInput: "", expectedBehavior: "" });
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AiEvalResult | null>(null);
  const [lastRunId, setLastRunId] = React.useState<string | null>(null);

  async function run() {
    if (!form.featureName || !form.systemPrompt || !form.testInput || !form.expectedBehavior) {
      toast.error("Fill in all fields — evaluation needs a real prompt and a real expectation.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai-evaluation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setLastRunId(data.result.runId ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't run that evaluation.");
    } finally {
      setLoading(false);
    }
  }

  async function replay() {
    if (!lastRunId) {
      toast.error("Run an evaluation first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai-evaluation/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalRunId: lastRunId, updatedSystemPrompt: form.systemPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't replay that.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-1.5">
          <FlaskConical className="size-3.5" /> AI Evaluation Studio
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3.5 text-sm">
          <p className="text-micro text-muted-foreground">
            Test an AI feature you&rsquo;re building — a real prompt, a real input, run through the same central AI
            router Ropes uses, then judged against what you expected.
          </p>
          <div>
            <Label className="text-micro">Feature name</Label>
            <Input value={form.featureName} onChange={(e) => setForm((f) => ({ ...f, featureName: e.target.value }))} placeholder="e.g. Support ticket classifier" />
          </div>
          <div>
            <Label className="text-micro">System prompt</Label>
            <Textarea value={form.systemPrompt} onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))} rows={3} className="font-mono text-xs" />
          </div>
          <div>
            <Label className="text-micro">Test input</Label>
            <Textarea value={form.testInput} onChange={(e) => setForm((f) => ({ ...f, testInput: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label className="text-micro">Expected behavior</Label>
            <Textarea value={form.expectedBehavior} onChange={(e) => setForm((f) => ({ ...f, expectedBehavior: e.target.value }))} rows={2} />
          </div>
          <Button onClick={run} disabled={loading} className="w-fit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Run evaluation"}
          </Button>

          {result && (
            <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Badge variant={result.verdict === "pass" ? "outline" : "destructive"}>{result.verdict}</Badge>
                <span className="text-micro text-muted-foreground">Correctness: {result.correctnessScore}/100</span>
                <span className="text-micro text-muted-foreground">{result.latencyMs}ms</span>
              </div>
              <p>
                <span className="font-medium">Hallucination risk: </span>
                {result.hallucinationRisk}
              </p>
              <p>{result.feedback}</p>
              <p className="text-micro text-muted-foreground">
                <span className="font-medium">Actual output: </span>
                {result.actualOutput.slice(0, 300)}
              </p>
              {result.verdict === "fail" && (
                <Button size="sm" variant="outline" onClick={replay} disabled={loading} className="w-fit gap-1.5">
                  <RefreshCcw className="size-3.5" /> Fix prompt above &amp; replay
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
