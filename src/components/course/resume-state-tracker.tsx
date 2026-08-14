"use client";

import { useEffect, useRef } from "react";

/**
 * Silent, debounced resume-state autosave. Fires once on mount (module/tab
 * changed) and does not retry on failure — losing one resume-state write is
 * harmless (the learner just resumes one step further back next time), so
 * this deliberately doesn't surface errors or block the UI.
 */
export function ResumeStateTracker({
  courseId,
  moduleId,
  activeTab,
  exerciseId,
}: {
  courseId: string;
  moduleId: string;
  activeTab: "overview" | "playbook" | "practice" | "interview";
  exerciseId?: string | null;
}) {
  const lastSent = useRef<string>("");

  useEffect(() => {
    const key = `${courseId}:${moduleId}:${activeTab}:${exerciseId ?? ""}`;
    if (lastSent.current === key) return;
    lastSent.current = key;

    const timeout = setTimeout(() => {
      void fetch("/api/resume-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, moduleId, activeTab, exerciseId: exerciseId ?? null }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timeout);
  }, [courseId, moduleId, activeTab, exerciseId]);

  return null;
}
