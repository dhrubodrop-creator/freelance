export type FunnelStep =
  | "seo_visitor"
  | "tool_started"
  | "tool_completed"
  | "result_viewed"
  | "course_viewed"
  | "checkout_viewed"
  | "checkout_started"
  | "payment_completed"
  | "course_activated"
  | "project_started"
  | "project_completed";

export interface FunnelMetrics {
  seo_visitor: number;
  tool_started: number;
  tool_completed: number;
  result_viewed: number;
  course_viewed: number;
  checkout_viewed: number;
  checkout_started: number;
  payment_completed: number;
  course_activated: number;
  project_started: number;
  project_completed: number;
}

export function trackFunnelStep(step: FunnelStep, metadata?: Record<string, string>): void {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("ropes_funnel_events") || "[]";
      const events = JSON.parse(stored);
      events.push({
        step,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      });
      localStorage.setItem("ropes_funnel_events", JSON.stringify(events.slice(-50)));
    } catch {
      // Storage unavailable fallback
    }
  }
}
