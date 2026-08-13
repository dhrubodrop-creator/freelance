"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ModuleGuidance, ModuleRow } from "@/types/db";

const GUIDANCE_LABEL: Record<ModuleGuidance["depth"], string> = {
  review: "Review",
  full: "",
  foundation_plus_practice: "Foundation+",
  advanced_challenge: "Challenge",
};

export function ModuleSidebar({
  courseSlug,
  modules,
  unlockedIds,
  completedIds,
  guidance,
}: {
  courseSlug: string;
  modules: ModuleRow[];
  unlockedIds: Set<string>;
  completedIds: Set<string>;
  guidance?: Record<string, ModuleGuidance>;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {modules.map((module, i) => {
        const unlocked = unlockedIds.has(module.id);
        const completed = completedIds.has(module.id);
        const href = `/courses/${courseSlug}/learn/${module.id}`;
        const active = pathname === href;
        const moduleGuidance = guidance?.[module.id];
        const guidanceLabel = moduleGuidance ? GUIDANCE_LABEL[moduleGuidance.depth] : "";

        const content = (
          <span
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active && "bg-primary-50 text-primary-700 font-medium",
              !active && unlocked && "text-foreground hover:bg-muted",
              !unlocked && "text-muted-foreground/50"
            )}
          >
            {completed ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" />
            ) : unlocked ? (
              <Circle className="size-4 shrink-0" />
            ) : (
              <Lock className="size-3.5 shrink-0" />
            )}
            <span className="flex-1">
              {i + 1}. {module.title}
            </span>
            {guidanceLabel && (
              <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px] font-medium">
                {guidanceLabel}
              </Badge>
            )}
          </span>
        );

        return unlocked ? (
          <Link key={module.id} href={href}>
            {content}
          </Link>
        ) : (
          <span key={module.id} aria-disabled className="cursor-not-allowed">
            {content}
          </span>
        );
      })}
    </nav>
  );
}
