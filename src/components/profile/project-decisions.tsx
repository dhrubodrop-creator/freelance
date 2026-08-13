"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ProjectDecisionRow } from "@/types/db";

export function ProjectDecisions({
  portfolioItemId,
  decisions,
}: {
  portfolioItemId: string;
  decisions: ProjectDecisionRow[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(decisions.length > 0);
  const [adding, setAdding] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ decision: "", alternatives: "", reasoning: "", tradeoff: "" });

  async function submit() {
    if (!form.decision.trim() || !form.reasoning.trim()) {
      toast.error("Decision and reasoning are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: form.decision,
          alternatives: form.alternatives || null,
          reasoning: form.reasoning,
          tradeoff: form.tradeoff || null,
        }),
      });
      if (!res.ok) throw new Error();
      setForm({ decision: "", alternatives: "", reasoning: "", tradeoff: "" });
      setAdding(false);
      toast.success("Decision logged");
      router.refresh();
    } catch {
      toast.error("Couldn't save that — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/decisions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't remove that — try again.");
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span>Decision log{decisions.length > 0 ? ` (${decisions.length})` : ""}</span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3.5">
          {decisions.length === 0 && (
            <p className="text-micro text-muted-foreground">
              No decisions logged yet — this is what turns &ldquo;I used RAG&rdquo; into interview-ready proof of
              your thinking.
            </p>
          )}
          {decisions.map((d) => (
            <div key={d.id} className="rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{d.decision}</p>
                <button type="button" onClick={() => remove(d.id)} aria-label="Delete decision" className="shrink-0">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {d.alternatives && (
                <p className="mt-1 text-micro text-muted-foreground">
                  <span className="font-medium">Alternatives: </span>
                  {d.alternatives}
                </p>
              )}
              <p className="mt-1 text-micro text-muted-foreground">
                <span className="font-medium">Reasoning: </span>
                {d.reasoning}
              </p>
              {d.tradeoff && (
                <p className="mt-1 text-micro text-muted-foreground">
                  <span className="font-medium">Tradeoff: </span>
                  {d.tradeoff}
                </p>
              )}
            </div>
          ))}

          {adding ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <Label className="text-micro">What did you decide?</Label>
                <Input
                  value={form.decision}
                  onChange={(e) => setForm((f) => ({ ...f, decision: e.target.value }))}
                  placeholder="e.g. Used RAG instead of fine-tuning"
                />
              </div>
              <div>
                <Label className="text-micro">Alternatives you considered</Label>
                <Input
                  value={form.alternatives}
                  onChange={(e) => setForm((f) => ({ ...f, alternatives: e.target.value }))}
                  placeholder="e.g. Fine-tuning, prompt-only"
                />
              </div>
              <div>
                <Label className="text-micro">Why this one?</Label>
                <Textarea
                  value={form.reasoning}
                  onChange={(e) => setForm((f) => ({ ...f, reasoning: e.target.value }))}
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-micro">What did it cost you?</Label>
                <Input
                  value={form.tradeoff}
                  onChange={(e) => setForm((f) => ({ ...f, tradeoff: e.target.value }))}
                  placeholder="e.g. More retrieval complexity"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={submit} disabled={submitting}>
                  {submitting ? "Saving…" : "Save decision"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" size="sm" variant="outline" className="w-fit gap-1.5" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Log a decision
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
