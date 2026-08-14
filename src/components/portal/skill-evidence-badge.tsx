"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { MasteryLevel } from "@/types/db";

const LEVEL_VARIANT: Record<MasteryLevel, "outline" | "accent" | "success"> = {
  not_started: "outline",
  learning: "outline",
  practicing: "outline",
  demonstrated: "success",
  strong: "accent",
};

/** Value-layer P1 — click a skill to see exactly why it shows this level ("why do you think I know this?"). */
export function SkillEvidenceBadge({ name, level, explanation }: { name: string; level: MasteryLevel; explanation: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inline-flex flex-col items-start">
      <button type="button" onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        <Badge variant={LEVEL_VARIANT[level]} className={level === "not_started" ? "opacity-40" : ""}>
          {name}
        </Badge>
      </button>
      {open && (
        <div className="mt-1.5 max-w-64 rounded-md border border-border bg-popover px-2.5 py-2 text-micro leading-4 text-muted-foreground shadow-sm">
          {explanation}
        </div>
      )}
    </div>
  );
}
