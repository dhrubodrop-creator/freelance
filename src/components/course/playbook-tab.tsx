import {
  Map,
  Brain,
  GitBranch,
  Workflow,
  AlertTriangle,
  Wrench,
  ListChecks,
  FileStack,
  BookMarked,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { MarkdownContent } from "@/components/course/markdown-content";
import type { ModulePlaybookSectionRow } from "@/types/db";

const SECTION_META: Record<string, { icon: typeof Map; label: string }> = {
  the_field: { icon: Map, label: "The Field" },
  mental_models: { icon: Brain, label: "Mental Models" },
  decision_framework: { icon: GitBranch, label: "Decision Framework" },
  workflow: { icon: Workflow, label: "Professional Workflow" },
  failure_modes: { icon: AlertTriangle, label: "Failure Modes" },
  debugging_playbook: { icon: Wrench, label: "Debugging Playbook" },
  checklist: { icon: ListChecks, label: "Checklist" },
  template: { icon: FileStack, label: "Template" },
  resources: { icon: BookMarked, label: "Go Deeper" },
};

export function PlaybookTab({ sections }: { sections: ModulePlaybookSectionRow[] }) {
  if (sections.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No playbook content for this module yet.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">The Ropes Professional Playbook — this module</CardTitle>
        <p className="text-sm text-muted-foreground">
          A field manual, not a slide deck — mental models, decision frameworks, real failure modes, and
          reusable templates. Worth keeping open next to the course, and worth coming back to months later.
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="flex flex-col">
          {sections.map((section) => {
            const meta = SECTION_META[section.section_type] ?? { icon: BookMarked, label: section.section_type };
            const Icon = meta.icon;
            return (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-accent-600" />
                    <span className="flex flex-col items-start">
                      <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                      </span>
                      <span>{section.title}</span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <MarkdownContent content={section.content} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
