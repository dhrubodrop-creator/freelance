import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Stock tailwind-merge doesn't know about this project's custom theme
// (src/../tailwind.config.ts): our brand color tokens and the
// bg-mesh-hero/bg-grain background-image utilities. Without this, it falls
// back to a generic "any bg-<word> is a background-color" heuristic and
// dedupes bg-primary/bg-mesh-hero/bg-noise down to just the last one in a
// className string — silently dropping the hero background (found via
// real browser QA, not caught by build/typecheck).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "bg-color": [
        "bg-primary",
        "bg-primary-50",
        "bg-primary-100",
        "bg-primary-600",
        "bg-primary-700",
        "bg-accent",
        "bg-accent-50",
        "bg-accent-600",
        "bg-secondary",
        "bg-success",
        "bg-destructive",
        { "bg-ink": ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] },
      ],
      "text-color": [
        "text-primary",
        "text-primary-50",
        "text-primary-100",
        "text-primary-600",
        "text-primary-700",
        "text-accent",
        "text-accent-50",
        "text-accent-600",
        "text-secondary",
        "text-success",
        "text-destructive",
        { "text-ink": ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] },
      ],
      "border-color": [
        "border-primary",
        "border-accent",
        "border-secondary",
        "border-success",
        "border-destructive",
        { "border-ink": ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] },
      ],
      "bg-image": ["bg-mesh-hero", "bg-noise"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
