"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown, GitGraph, Loader2, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EvidenceEvent } from "@/lib/evidence-timeline";

type EventTypeStyle = Record<EvidenceEvent["type"], "outline" | "accent" | "destructive" | "success">;
const STYLE: EventTypeStyle = {
  checkpoint: "accent",
  decision: "outline",
  verification_pass: "success",
  verification_fail: "destructive",
  github_activity: "outline",
  case_study_approved: "success",
};

export function EvidencePanel({
  portfolioItemId,
  repoFullName,
  hasArchitecture,
}: {
  portfolioItemId: string;
  repoFullName: string | null;
  hasArchitecture: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [timeline, setTimeline] = React.useState<EvidenceEvent[] | null>(null);
  const [diagramLoading, setDiagramLoading] = React.useState(false);
  const [diagram, setDiagram] = React.useState<string | null>(null);

  async function loadTimeline() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/evidence-timeline`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setTimeline(data.timeline);
    } catch {
      toast.error("Couldn't load the evidence timeline.");
    } finally {
      setLoading(false);
    }
  }

  async function generateDiagram() {
    if (!hasArchitecture) {
      toast.error("Set an architecture (in Architecture check) before generating a diagram.");
      return;
    }
    setDiagramLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/architecture-diagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDiagram(data.mermaid);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate a diagram.");
    } finally {
      setDiagramLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => {
          setExpanded((e) => !e);
          if (!timeline && !expanded) void loadTimeline();
        }}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-1.5">
          <History className="size-3.5" /> Evidence &amp; architecture diagram
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3.5 text-sm">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {timeline && timeline.length === 0 && <p className="text-micro text-muted-foreground">No evidence recorded yet.</p>}
          {timeline && timeline.length > 0 && (
            <div className="flex flex-col gap-2">
              {timeline.map((e, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Badge variant={STYLE[e.type]} className="mt-0.5 shrink-0 text-micro capitalize">
                    {e.type.replace(/_/g, " ")}
                  </Badge>
                  <div>
                    <p>{e.label}</p>
                    <p className="text-micro text-muted-foreground">{new Date(e.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3">
            <Button size="sm" variant="outline" onClick={generateDiagram} disabled={diagramLoading} className="w-fit gap-1.5">
              {diagramLoading ? <Loader2 className="size-3.5 animate-spin" /> : <GitGraph className="size-3.5" />}
              Generate architecture diagram
            </Button>
            {diagram && (
              <div className="mt-2">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">{diagram}</pre>
                <p className="mt-1 text-micro text-muted-foreground">
                  Paste this into a README.md between ```mermaid fences — GitHub renders it natively.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
