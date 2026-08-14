"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronDown, HelpCircle, Loader2, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlainTerm } from "@/components/shared/plain-term";
import type { ProjectHealth } from "@/lib/production-readiness";

export function ProductionReadinessCard({ portfolioItemId, initialDeploymentUrl }: { portfolioItemId: string; initialDeploymentUrl: string | null }) {
  const [expanded, setExpanded] = React.useState(false);
  const [deploymentUrl, setDeploymentUrl] = React.useState(initialDeploymentUrl ?? "");
  const [health, setHealth] = React.useState<ProjectHealth | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanInfo, setScanInfo] = React.useState<{ scanned: string[]; skipped: string[] } | null>(null);

  async function loadHealth() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/health`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setHealth(data.health);
    } catch {
      toast.error("Couldn't load project health.");
    } finally {
      setLoading(false);
    }
  }

  async function saveUrl() {
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/deployment-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: deploymentUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success("Deployment URL saved");
    } catch {
      toast.error("Enter a valid URL.");
    }
  }

  async function scan() {
    setScanning(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/production-readiness-scan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHealth(data.health);
      setScanInfo({ scanned: data.scannedDimensions, skipped: data.skippedDimensions });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't scan this project.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => {
          setExpanded((e) => !e);
          if (!health && !expanded) void loadHealth();
        }}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-1.5">
          <Rocket className="size-3.5" /> Production readiness{health?.score !== null && health?.score !== undefined ? ` — ${health.score}/100` : ""}
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-3.5 text-sm">
          <PlainTerm term="deployment" className="text-micro" />
          <div className="flex gap-2">
            <Input value={deploymentUrl} onChange={(e) => setDeploymentUrl(e.target.value)} placeholder="https://your-deployed-app.vercel.app" />
            <Button size="sm" variant="outline" onClick={saveUrl}>
              Save
            </Button>
          </div>

          <Button size="sm" onClick={scan} disabled={scanning} className="w-fit gap-1.5">
            {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
            Make me production ready
          </Button>

          {loading && <Loader2 className="size-4 animate-spin" />}

          {scanInfo && scanInfo.skipped.length > 0 && (
            <p className="text-micro text-muted-foreground">Skipped (needs setup): {scanInfo.skipped.join(", ")}</p>
          )}

          {health && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {health.dimensions.map((d) => (
                  <div key={d.dimension} className="flex items-center gap-1.5 rounded-lg border border-border p-2">
                    {d.status === "pass" ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    ) : d.status === "issues" ? (
                      <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                    ) : (
                      <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-micro capitalize">{d.dimension.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>

              {health.blockers.length > 0 && (
                <div>
                  <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Blockers</p>
                  <ul className="mt-1 list-disc pl-4">
                    {health.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {health.nextActions.length > 0 && (
                <div className="flex flex-col gap-3">
                  {/* One dominant CTA (Phase 5) — the highest-priority real blocker (weighted, see
                      production-readiness.ts), not just the first item in dimension order. */}
                  <div className="rounded-lg border border-accent/40 bg-accent-50 p-3">
                    <p className="text-micro font-semibold uppercase tracking-wide text-accent-700">Fix the next thing</p>
                    <p className="mt-1 text-sm">{health.nextActions[0]}</p>
                  </div>

                  {health.nextActions.length > 1 && (
                    <div>
                      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        After that
                      </p>
                      <ul className="mt-1 flex flex-col gap-1">
                        {health.nextActions.slice(1).map((a, i) => (
                          <li key={i}>
                            <Badge variant="outline" className="mr-1.5">
                              you
                            </Badge>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-micro text-muted-foreground">
                    Every action here needs your review/fix — nothing is auto-applied.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
