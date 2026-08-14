"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Flag, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectCheckpointRow } from "@/types/db";

export function ProjectCheckpoints({
  portfolioItemId,
  checkpoints,
}: {
  portfolioItemId: string;
  checkpoints: ProjectCheckpointRow[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ label: "", task: "", learnerNote: "" });

  async function submit() {
    if (!form.label.trim()) {
      toast.error("Give this checkpoint a short label.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/checkpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          task: form.task || null,
          learnerNote: form.learnerNote || null,
        }),
      });
      if (!res.ok) throw new Error();
      setForm({ label: "", task: "", learnerNote: "" });
      setAdding(false);
      toast.success("Checkpoint saved");
      router.refresh();
    } catch {
      toast.error("Couldn't save that checkpoint — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span>Checkpoints{checkpoints.length > 0 ? ` (${checkpoints.length})` : ""}</span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3.5">
          {checkpoints.length === 0 && (
            <p className="text-micro text-muted-foreground">
              No checkpoints yet — save one at a real milestone so you can compare where this project stood over time.
            </p>
          )}
          {checkpoints.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 font-medium">
                  <Flag className="size-3.5 shrink-0 text-accent-600" />
                  {c.label}
                </p>
                <span className="shrink-0 text-micro text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              {c.task && (
                <p className="mt-1 text-micro text-muted-foreground">
                  <span className="font-medium">Task: </span>
                  {c.task}
                </p>
              )}
              {c.learner_note && <p className="mt-1 text-micro text-muted-foreground">{c.learner_note}</p>}
              <p className="mt-1 text-micro text-muted-foreground">
                {(c.state_snapshot as { decisionCount?: number }).decisionCount ?? 0} decisions logged at this point
                {(c.state_snapshot as { caseStudyApproved?: boolean }).caseStudyApproved ? " · case study approved" : ""}
              </p>
            </div>
          ))}

          {adding ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <Label className="text-micro">Label</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Auth working end to end"
                />
              </div>
              <div>
                <Label className="text-micro">Task (optional)</Label>
                <Input
                  value={form.task}
                  onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
                  placeholder="What you were working on"
                />
              </div>
              <div>
                <Label className="text-micro">Note (optional)</Label>
                <Input
                  value={form.learnerNote}
                  onChange={(e) => setForm((f) => ({ ...f, learnerNote: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={submit} disabled={submitting}>
                  {submitting ? "Saving…" : "Save checkpoint"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" size="sm" variant="outline" className="w-fit gap-1.5" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" /> Save checkpoint
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
