"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Circle, Factory, Loader2 } from "lucide-react";

import type { AssetStatus } from "@/lib/project-asset-factory";

const STATIC_HINTS: Record<string, { text: string; href?: string }> = {
  architecture: { text: "Generate via Evidence & architecture diagram below" },
  readme: { text: "Generated automatically when you use Build From My Idea" },
  tests: { text: "Generate via Definition of done below" },
  security: { text: "Run via Quality Labs below" },
  performance: { text: "Run via Quality Labs below" },
  ai_eval: { text: "Run via AI Evaluation Studio below" },
  case_study: { text: "Generate below" },
  resume_bullets: { text: "Generated together with your case study" },
  interview_story: { text: "Generated together with your case study" },
  service_offer: { text: "Tag this project to a skill you have real evidence for" },
  demo_script: { text: "Not tracked by Ropes yet" },
};

/** Project Asset Factory — what actually exists for THIS project, not what a button implies exists. */
export function ProjectAssetFactoryPanel({ portfolioItemId }: { portfolioItemId: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [assets, setAssets] = React.useState<{ key: string; label: string; status: AssetStatus }[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/asset-factory`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setAssets(data.assets);
    } catch {
      toast.error("Couldn't load the asset factory.");
    } finally {
      setLoading(false);
    }
  }

  const verifiedCount = assets?.filter((a) => a.status === "verified" || a.status === "created").length ?? 0;

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => {
          setExpanded((e) => !e);
          if (!assets && !expanded) void load();
        }}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-1.5">
          <Factory className="size-3.5" /> Project asset factory{assets ? ` (${verifiedCount}/${assets.length})` : ""}
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border p-3.5 text-sm">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {assets?.map((a) => {
            const hint: { text: string; href?: string } | undefined =
              a.key === "proposal"
                ? { text: "Generate from your dashboard", href: `/dashboard?openProposal=1&portfolioItemId=${encodeURIComponent(portfolioItemId)}` }
                : STATIC_HINTS[a.key];
            return (
              <div key={a.key} className="flex items-center justify-between gap-3 rounded bg-muted/40 px-2.5 py-1.5">
                <span className="flex items-center gap-2">
                  {a.status === "verified" ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                  ) : a.status === "created" ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-accent-600" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-muted-foreground/40" />
                  )}
                  {a.label}
                </span>
                {a.status === "verified" && <span className="text-micro text-success">Verified</span>}
                {a.status === "created" && <span className="text-micro text-accent-600">Created</span>}
                {a.status === "missing" && hint && (
                  hint.href ? (
                    <Link href={hint.href} className="text-micro text-accent-600 hover:underline">
                      {hint.text}
                    </Link>
                  ) : (
                    <span className="text-micro text-muted-foreground">{hint.text}</span>
                  )
                )}
                {a.status === "not_tracked" && <span className="text-micro text-muted-foreground">Not tracked yet</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
