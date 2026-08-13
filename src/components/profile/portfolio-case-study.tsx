"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Copy, Sparkles, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PortfolioCaseStudyRow } from "@/types/db";

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copied");
      }}
      aria-label="Copy"
      className="shrink-0"
    >
      <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
    </button>
  );
}

export function PortfolioCaseStudy({
  portfolioItemId,
  caseStudy,
}: {
  portfolioItemId: string;
  caseStudy: PortfolioCaseStudyRow | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/generate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      setExpanded(true);
      toast.success("Draft ready — review before approving");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function setApproved(approved: boolean) {
    setApproving(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't save that — try again.");
    } finally {
      setApproving(false);
    }
  }

  if (!caseStudy) {
    return (
      <Button type="button" size="sm" variant="outline" className="w-fit gap-1.5" onClick={generate} disabled={generating}>
        <Sparkles className="size-3.5" />
        {generating ? "Writing your case study…" : "Generate case study & resume bullets"}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          Case study & resume bullets
          {caseStudy.approved ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="size-3" /> Approved
            </Badge>
          ) : (
            <Badge variant="outline">Draft — review needed</Badge>
          )}
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border p-3.5 text-sm">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Case study</p>
              <CopyButton text={caseStudy.case_study} />
            </div>
            <p className="whitespace-pre-line text-muted-foreground">{caseStudy.case_study}</p>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Short version</p>
              <CopyButton text={caseStudy.short_version} />
            </div>
            <p className="text-muted-foreground">{caseStudy.short_version}</p>
          </div>
          {caseStudy.resume_bullets.length > 0 && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Resume bullets</p>
                <CopyButton text={caseStudy.resume_bullets.map((b) => `• ${b}`).join("\n")} />
              </div>
              <ul className="flex flex-col gap-1 text-muted-foreground">
                {caseStudy.resume_bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Interview story</p>
              <CopyButton text={caseStudy.interview_story} />
            </div>
            <p className="whitespace-pre-line text-muted-foreground">{caseStudy.interview_story}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!caseStudy.approved ? (
              <Button size="sm" variant="accent" onClick={() => setApproved(true)} disabled={approving} className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Looks accurate — approve
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setApproved(false)} disabled={approving}>
                Unapprove
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
              {generating ? "Regenerating…" : "Regenerate"}
            </Button>
          </div>
          <p className="text-micro text-muted-foreground">
            AI-drafted from your project data — check it&rsquo;s accurate before you approve or use it anywhere.
          </p>
        </div>
      )}
    </div>
  );
}
