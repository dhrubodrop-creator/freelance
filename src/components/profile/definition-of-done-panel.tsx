"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, FlaskConical, Loader2, Plus, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AcceptanceCheckRow, AcceptanceCheckType } from "@/types/db";

const CHECK_TYPE_LABEL: Record<AcceptanceCheckType, string> = {
  manual: "Manual (self-attested)",
  http_200: "URL returns 200",
  http_auth_rejects: "URL rejects unauthorized access",
  deployment_live: "Deployment is live",
};

export function DefinitionOfDonePanel({
  portfolioItemId,
  checks,
  repoFullName,
}: {
  portfolioItemId: string;
  checks: AcceptanceCheckRow[];
  repoFullName: string | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<{ description: string; checkType: AcceptanceCheckType; targetUrl: string }>({
    description: "",
    checkType: "manual",
    targetUrl: "",
  });

  async function addCheck() {
    if (!form.description.trim()) {
      toast.error("Describe the criterion first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/acceptance-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          checkType: form.checkType,
          targetUrl: form.checkType === "manual" ? null : form.targetUrl,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm({ description: "", checkType: "manual", targetUrl: "" });
      setAdding(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that criterion.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runCheck(id: string) {
    setRunningId(id);
    try {
      const res = await fetch(`/api/acceptance-checks/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't run that check.");
    } finally {
      setRunningId(null);
    }
  }

  async function toggleAttest(id: string, value: boolean) {
    try {
      const res = await fetch(`/api/acceptance-checks/${id}/attest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't update that.");
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span>Definition of done{checks.length > 0 ? ` (${checks.length})` : ""}</span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3.5">
          {checks.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 p-2.5 text-sm">
              <div className="flex items-start gap-2">
                {c.check_type === "manual" ? (
                  <Checkbox checked={c.self_attested} onCheckedChange={(v) => toggleAttest(c.id, Boolean(v))} className="mt-0.5" />
                ) : c.last_result === "pass" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : c.last_result === "fail" ? (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                ) : (
                  <div className="mt-1 size-3 shrink-0 rounded-full border border-border" />
                )}
                <div>
                  <p>{c.description}</p>
                  <p className="text-micro text-muted-foreground">{CHECK_TYPE_LABEL[c.check_type]}</p>
                </div>
              </div>
              {c.check_type !== "manual" && (
                <Button size="sm" variant="ghost" onClick={() => runCheck(c.id)} disabled={runningId === c.id}>
                  {runningId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : "Run"}
                </Button>
              )}
            </div>
          ))}

          {adding ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <Label className="text-micro">Criterion</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label className="text-micro">Type</Label>
                <Select value={form.checkType} onValueChange={(v) => setForm((f) => ({ ...f, checkType: v as AcceptanceCheckType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CHECK_TYPE_LABEL) as AcceptanceCheckType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {CHECK_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.checkType !== "manual" && (
                <div>
                  <Label className="text-micro">Target URL</Label>
                  <Input value={form.targetUrl} onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))} placeholder="https://your-app.vercel.app" />
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={addCheck} disabled={submitting}>
                  {submitting ? "Saving…" : "Add criterion"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="w-fit gap-1.5" onClick={() => setAdding(true)}>
                <Plus className="size-3.5" /> Add criterion
              </Button>
              <TestGeneratorDialog portfolioItemId={portfolioItemId} criteria={checks.map((c) => c.description)} repoFullName={repoFullName} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TestGeneratorDialog({
  portfolioItemId,
  criteria,
  repoFullName,
}: {
  portfolioItemId: string;
  criteria: string[];
  repoFullName: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [filePath, setFilePath] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ framework: string; testCode: string; notes: string } | null>(null);

  async function run() {
    if (criteria.length === 0) {
      toast.error("Add at least one acceptance criterion first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/test-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId, acceptanceCriteria: criteria, repoFullName, filePath: filePath || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.tests);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate tests.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-fit gap-1.5">
          <FlaskConical className="size-3.5" /> Generate tests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate tests from your acceptance criteria</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {repoFullName && (
            <Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="Optional: file path to ground tests in real code" />
          )}
          <Button onClick={run} disabled={loading} className="w-fit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Generate"}
          </Button>
          {result && (
            <div className="flex flex-col gap-2 text-sm">
              <Badge variant="outline" className="w-fit">
                {result.framework}
              </Badge>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">{result.testCode}</pre>
              <p className="text-muted-foreground">{result.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
