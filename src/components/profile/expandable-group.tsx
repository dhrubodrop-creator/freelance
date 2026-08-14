"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Wand2 } from "lucide-react";

/**
 * Groups the per-project engineering-studio tools (GitHub link, Code Coach,
 * Definition of Done, Quality Labs, AI Evaluation Studio, Evidence,
 * Production Readiness, Graduation Replay) behind one collapsed toggle so
 * a project card isn't a wall of ten open panels by default — the brief's
 * own "avoid dashboard overload" UX principle.
 */
export function ExpandableGroup({ label, children }: { label: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-dashed border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-accent-600"
      >
        <span className="flex items-center gap-1.5">
          <Wand2 className="size-3.5" /> {label}
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div className="flex flex-col gap-2.5 border-t border-border p-3 pt-3">{children}</div>}
    </div>
  );
}
