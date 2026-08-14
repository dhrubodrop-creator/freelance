"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bug, Code2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CodeExplanation, DebugResult } from "@/lib/code-coach";

export function CodeCoachPanel({ repoFullName }: { repoFullName: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {repoFullName && <ExplainCodeDialog repoFullName={repoFullName} />}
      <DebugDialog repoFullName={repoFullName} />
    </div>
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
