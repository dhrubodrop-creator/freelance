"use client";

import { useState, type ReactNode } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResumeStateTracker } from "@/components/course/resume-state-tracker";

type TabValue = "overview" | "playbook" | "practice" | "interview";

/**
 * Post-audit P2 fix: resume-state previously only ever wrote "overview" —
 * the Tabs component wasn't controlled, so tab switches were never tracked.
 * This makes it controlled and reports the real current tab (and, on the
 * Practice tab, the next incomplete exercise) to ResumeStateTracker.
 */
export function ModuleContentTabs({
  courseId,
  moduleId,
  initialTab,
  nextExerciseId,
  overview,
  playbook,
  practice,
  interview,
}: {
  courseId: string;
  moduleId: string;
  initialTab: TabValue;
  nextExerciseId: string | null;
  overview: ReactNode;
  playbook: ReactNode | null;
  practice: ReactNode | null;
  interview: ReactNode | null;
}) {
  const [tab, setTab] = useState<TabValue>(initialTab);

  return (
    <>
      <ResumeStateTracker
        courseId={courseId}
        moduleId={moduleId}
        activeTab={tab}
        exerciseId={tab === "practice" ? nextExerciseId : null}
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {playbook && <TabsTrigger value="playbook">Playbook</TabsTrigger>}
          {practice && <TabsTrigger value="practice">Practice</TabsTrigger>}
          {interview && <TabsTrigger value="interview">Interview Prep</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview">{overview}</TabsContent>
        {playbook && <TabsContent value="playbook">{playbook}</TabsContent>}
        {practice && <TabsContent value="practice">{practice}</TabsContent>}
        {interview && <TabsContent value="interview">{interview}</TabsContent>}
      </Tabs>
    </>
  );
}
