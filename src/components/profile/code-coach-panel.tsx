"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bug, Code2, GitCompareArrows, Loader2, ShieldQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CodeExplanation, DebugResult } from "@/lib/code-coach";
import type { ArchitectureDriftResult, CodeReviewResult } from "@/lib/code-review";

export function CodeCoachPanel({ portfolioItemId, repoFullName }: { portfolioItemId: string; repoFullName: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {repoFullName && <ExplainCodeDialog repoFullName={repoFullName} />}
      <DebugDialog repoFullName={repoFullName} />
      <ReviewBeforeCommitDialog portfolioItemId={portfolioItemId} />
      {repoFullName && <ArchitectureCheckButton portfolioItemId={portfolioItemId} repoFullName={repoFullName} />}
      <AiCodeDefenseDialog portfolioItemId={portfolioItemId} />
    </div>
  );
}

function ReviewBeforeCommitDialog({ portfolioItemId }: { portfolioItemId: string }) {
  const [open, setOpen] = useState(false);
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<CodeReviewResult | null>(null);

  async function run() {
    if (!diff.trim()) return;
    setLoading(true);
    setReview(null);
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff, portfolioItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data.review);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't review that diff.");
    } finally {
      setLoading(false);
    }
  }

  const severityVariant = { low: "outline", medium: "accent", high: "destructive" } as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <GitCompareArrows className="size-3.5" /> Review before commit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review before commit</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Textarea placeholder="Paste your diff (git diff output)" value={diff} onChange={(e) => setDiff(e.target.value)} rows={8} className="font-mono text-xs" />
          <Button onClick={run} disabled={loading} className="w-fit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Review"}
          </Button>
          {review && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-muted-foreground">{review.overallAssessment}</p>
              {review.findings.length === 0 && <p className="text-success">No issues found in this diff.</p>}
              {review.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5">
                  <Badge variant={severityVariant[f.severity]} className="shrink-0 text-micro capitalize">
                    {f.category.replace(/_/g, " ")}
                  </Badge>
                  <span>{f.summary}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ArchitectureCheckButton({ portfolioItemId, repoFullName }: { portfolioItemId: string; repoFullName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchitectureDriftResult | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/architecture-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId, repoFullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't check architecture.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && !result && !loading) void run();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ShieldQuestion className="size-3.5" /> Architecture check
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Architecture Guardian</DialogTitle>
        </DialogHeader>
        {loading && <Loader2 className="size-5 animate-spin" />}
        {result && (
          <div className="flex flex-col gap-3 text-sm">
            <Badge variant={result.drifted ? "destructive" : "outline"} className="w-fit">
              {result.drifted ? "Drift detected" : "No meaningful drift"}
            </Badge>
            {result.drifted && (
              <>
                <p>
                  <span className="font-medium">What changed: </span>
                  {result.whatChanged}
                </p>
                <p>
                  <span className="font-medium">Why it matters: </span>
                  {result.whyItMatters}
                </p>
                {result.whatCouldBreak && (
                  <p>
                    <span className="font-medium">What could break: </span>
                    {result.whatCouldBreak}
                  </p>
                )}
                <p>
                  <span className="font-medium">Recommended action: </span>
                  {result.recommendedAction}
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AiCodeDefenseDialog({ portfolioItemId }: { portfolioItemId: string }) {
  const [open, setOpen] = useState(false);
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<{ understood: boolean; feedback: string } | null>(null);

  async function getQuestions() {
    if (!diff.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-code-defense/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff, portfolioItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(""));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate questions.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswers() {
    if (!questions) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-code-defense/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff, portfolioItemId, questions, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvaluation(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't evaluate your answers.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuestions(null);
          setEvaluation(null);
          setDiff("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ShieldQuestion className="size-3.5" /> Defend this code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Defend this code</DialogTitle>
        </DialogHeader>
        {!questions ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Paste code (yours or AI-assisted) and answer questions about it — mastery only counts when you can
              actually explain it.
            </p>
            <Textarea placeholder="Paste the diff or code" value={diff} onChange={(e) => setDiff(e.target.value)} rows={6} className="font-mono text-xs" />
            <Button onClick={getQuestions} disabled={loading} className="w-fit">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Get questions"}
            </Button>
          </div>
        ) : !evaluation ? (
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{q}</p>
                <Textarea
                  value={answers[i] ?? ""}
                  onChange={(e) => setAnswers((a) => a.map((val, idx) => (idx === i ? e.target.value : val)))}
                  rows={2}
                  className="mt-1"
                />
              </div>
            ))}
            <Button onClick={submitAnswers} disabled={loading} className="w-fit">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Submit answers"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <Badge variant={evaluation.understood ? "outline" : "destructive"} className="w-fit">
              {evaluation.understood ? "Understanding demonstrated" : "Not yet demonstrated"}
            </Badge>
            <p>{evaluation.feedback}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExplainCodeDialog({ repoFullName }: { repoFullName: string }) {
  const [open, setOpen] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CodeExplanation | null>(null);

  async function run() {
    if (!filePath.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/coach/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName, filePath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.explanation);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't explain that file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Code2 className="size-3.5" /> Explain my code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Explain my code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="src/lib/example.ts" />
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Explain"}
            </Button>
          </div>
          {result && (
            <div className="flex flex-col gap-3 text-sm">
              <Section title="Purpose" body={result.purpose} />
              <Section title="Data flow" body={result.dataFlow} />
              <ListSection title="Dependencies" items={result.dependencies} />
              <ListSection title="Risks" items={result.risks} />
              <ListSection title="Simplification opportunities" items={result.simplificationOpportunities} />
              <ListSection title="Security concerns" items={result.securityConcerns} />
              <ListSection title="Performance considerations" items={result.performanceConsiderations} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DebugDialog({ repoFullName }: { repoFullName: string | null }) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);

  async function run() {
    if (!errorMessage.trim()) {
      toast.error("Paste the error message first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/coach/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage,
          stackTrace: stackTrace || null,
          repoFullName: filePath && repoFullName ? repoFullName : null,
          filePath: filePath || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't debug that.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bug className="size-3.5" /> Debug this
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Debug this</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Textarea placeholder="Error message" value={errorMessage} onChange={(e) => setErrorMessage(e.target.value)} rows={2} />
          <Textarea placeholder="Stack trace / logs (optional)" value={stackTrace} onChange={(e) => setStackTrace(e.target.value)} rows={3} />
          {repoFullName && (
            <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="Related file path (optional)" />
          )}
          <Button onClick={run} disabled={loading} className="w-fit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Debug"}
          </Button>
          {result && (
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Likely causes</p>
                {result.likelyCauses.map((c, i) => (
                  <p key={i} className="mt-1">
                    <span className="font-medium">{c.cause}</span> — {c.evidence}
                  </p>
                ))}
              </div>
              <ListSection title="Tests to run" items={result.testsToRun} />
              <Section title="Proposed fix" body={result.proposedFix} />
              <Section title="Why this happens" body={result.explanation} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-1 list-disc pl-4">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
