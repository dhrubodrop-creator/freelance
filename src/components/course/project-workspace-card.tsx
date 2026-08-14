import Link from "next/link";
import { FolderKanban, FolderPlus, GitBranch, GraduationCap, FolderGit2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CapstoneSubmissionStatus } from "@/types/db";

/**
 * One reusable workspace card shown on every course's module Overview page
 * (not just the AI-Native track). Reads real state (does a portfolio project
 * exist for this course, does the course have a capstone, what's the
 * learner's submission status) and only shows actions that are actually
 * valid right now — no "Start capstone" before there's an eligible project,
 * no claiming a deliverable is done because the course was purchased.
 */
export function ProjectWorkspaceCard({
  activeModuleTitle,
  activeModuleIndex,
  nextTaskLabel,
  completedStageTitles,
  hasPortfolioProject,
  capstoneExists,
  capstoneStatus,
}: {
  activeModuleTitle: string;
  activeModuleIndex: number;
  nextTaskLabel: string;
  completedStageTitles: string[];
  hasPortfolioProject: boolean;
  capstoneExists: boolean;
  capstoneStatus: CapstoneSubmissionStatus | null;
}) {
  const actions: { href: string; label: string; icon: typeof FolderPlus }[] = [];

  if (!hasPortfolioProject) {
    actions.push({ href: "/portfolio", label: "Create course project", icon: FolderPlus });
  } else {
    actions.push({ href: "/portfolio", label: "Open portfolio", icon: FolderGit2 });
    actions.push({ href: "/portfolio", label: "Record a decision", icon: GitBranch });
  }

  if (capstoneExists && hasPortfolioProject) {
    if (!capstoneStatus) {
      actions.push({ href: "/portfolio", label: "Start capstone", icon: GraduationCap });
    } else if (capstoneStatus === "reviewed") {
      actions.push({ href: "/portfolio", label: "View submitted capstone", icon: GraduationCap });
    } else {
      actions.push({ href: "/portfolio", label: "Continue capstone", icon: GraduationCap });
    }
  }

  return (
    <Card className="border-primary-100 bg-primary-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="size-4 text-primary-700" />
          Project workspace
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Current stage</p>
          <p className="mt-1 font-medium">
            {activeModuleIndex + 1}. {activeModuleTitle}
          </p>
          <p className="mt-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">Next task</p>
          <p className="mt-1 text-muted-foreground">{nextTaskLabel}</p>
        </div>
        <div>
          <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Completed stages</p>
          <p className="mt-1 text-muted-foreground">
            {completedStageTitles.length > 0 ? completedStageTitles.join(" · ") : "No completed stages yet."}
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-1.5 font-semibold text-accent-600 hover:underline"
              >
                <action.icon className="size-3.5 shrink-0" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
