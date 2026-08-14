"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

import { GLOSSARY, type GlossaryTerm } from "@/lib/glossary";
import { cn } from "@/lib/utils";

/**
 * Beginner-language layer (Phase 4) — shows the plain-language label by default, with a
 * small "What's this?" toggle that reveals the real technical term and a short
 * explanation. Never hides the technical term permanently — just doesn't lead with it.
 */
export function PlainTerm({ term, className }: { term: GlossaryTerm; className?: string }) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[term];

  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <span className="inline-flex items-center gap-1">
        {entry.plain}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
          aria-label={`What's this? ${entry.technical}`}
        >
          <HelpCircle className="size-3.5" />
        </button>
      </span>
      {open && (
        <span className="max-w-72 rounded-md border border-border bg-popover px-2.5 py-2 text-micro leading-4 text-muted-foreground shadow-sm">
          <span className="mb-0.5 block font-medium text-foreground">{entry.technical}</span>
          {entry.explanation}
        </span>
      )}
    </span>
  );
}
