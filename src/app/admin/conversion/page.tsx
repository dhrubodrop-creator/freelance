import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow } from "@/types/db";

export const metadata: Metadata = {
  title: "Commercial Conversion Diagnostics | Ropes Admin",
  robots: { index: false, follow: false },
};

/**
 * Commercial data integrity fix — the previous version of this page hardcoded every number
 * (10,000 visitors, 36 payments, ₹50k tier, a "TRUST" friction diagnosis) with zero database
 * connection. Every number below is either a real query result or an explicit
 * "NOT MEASURED"/"NO DATA YET" label — never a fabricated figure, never a manufactured
 * conversion percentage. See DECISIONS.md-style rule this session established: real data
 * beats impressive data.
 */

// Funnel steps in order. `events` (one or more analytics_events.event_name values) is null for
// steps this codebase doesn't emit an event for yet — those are honestly reported as
// "EVENT NOT IMPLEMENTED", never silently shown as zero.
const FUNNEL_STEPS: { label: string; events: string[] | null; note?: string }[] = [
  { label: "Landing page view", events: null, note: "Not logged to analytics_events — Vercel Analytics tracks pageviews separately, not queryable here." },
  { label: "Tool started", events: null, note: "The SEO tools log to browser localStorage only, not the server-side analytics_events table — no server-queryable count exists." },
  { label: "Tool completed", events: null, note: "Same as above — client-side only, not server-queryable." },
  { label: "Diagnostic completed", events: ["diagnostic_completed"] },
  { label: "Course viewed", events: null, note: "No logEvent() call exists on the course detail page yet." },
  { label: "Preview viewed", events: null, note: "No logEvent() call exists for course preview sections yet." },
  { label: "Checkout viewed", events: ["checkout_viewed"], note: "Just added this pass — expect zero historical data before this deployment." },
  { label: "Checkout started", events: ["checkout_started"] },
  { label: "Payment completed", events: ["payment_completed"] },
  { label: "Enrollment activated", events: null, note: "Computed directly from enrollments.status = 'active' below, not from an event log — the DB row is the authoritative record." },
];

export default async function CommercialConversionDiagnosticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const range = params.range === "today" || params.range === "7d" || params.range === "30d" ? params.range : "all";

  const since =
    range === "today"
      ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      : range === "7d"
        ? new Date(Date.now() - 7 * 86_400_000).toISOString()
        : range === "30d"
          ? new Date(Date.now() - 30 * 86_400_000).toISOString()
          : null;

  const supabase = supabaseAdmin();

  const allEventNames = FUNNEL_STEPS.flatMap((s) => s.events ?? []);

  const [{ data: eventRows }, { data: enrollmentRows }, { data: courses }] = await Promise.all([
    (() => {
      let q = supabase.from("analytics_events").select("event_name, created_at").in("event_name", allEventNames);
      if (since) q = q.gte("created_at", since);
      return q;
    })(),
    (() => {
      let q = supabase.from("enrollments").select("id, status, course_id, created_at").eq("status", "active");
      if (since) q = q.gte("created_at", since);
      return q;
    })(),
    supabase.from("courses").select("id, title, price"),
  ]);

  const eventCounts = new Map<string, number>();
  for (const row of eventRows ?? []) {
    eventCounts.set(row.event_name, (eventCounts.get(row.event_name) ?? 0) + 1);
  }

  const courseById = new Map((courses as CourseRow[] | null ?? []).map((c) => [c.id, c]));
  const activeEnrollments = enrollmentRows ?? [];

  // Real revenue signal — sourced from the enrollments table (server-side, only reachable via
  // Razorpay signature verification, see activateEnrollment()), NOT from frontend analytics
  // events. This is a list-price estimate (courses.price at query time), not the exact amount
  // actually charged per transaction — Razorpay's own dashboard remains the authoritative ledger
  // for exact amounts (promo codes, price changes over time aren't reconstructed here).
  const estimatedRevenue = activeEnrollments.reduce((sum, e) => sum + (courseById.get(e.course_id) ? Number(courseById.get(e.course_id)!.price) : 0), 0);

  // ₹50,000-tier check — strict, per the brief: do not invent a ₹50k figure if no course is
  // actually priced there.
  const coursesAt50k = (courses as CourseRow[] | null ?? []).filter((c) => Number(c.price) === 50000);
  const enrollmentsAt50k = activeEnrollments.filter((e) => coursesAt50k.some((c) => c.id === e.course_id));
  const highestRealPrice = Math.max(0, ...(courses as CourseRow[] | null ?? []).map((c) => Number(c.price)));

  const rangeLabel = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days", all: "All time" }[range];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            Commercial Intelligence
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Commercial Conversion Diagnostics</h1>
          <p className="mt-2 text-sm text-slate-400">Based on real Ropes analytics and payment records.</p>
        </div>

        <div className="flex gap-2">
          {(["today", "7d", "30d", "all"] as const).map((r) => (
            <a
              key={r}
              href={`/admin/conversion?range=${r}`}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                range === r ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 text-slate-400 hover:border-slate-600"
              }`}
            >
              {{ today: "Today", "7d": "7 days", "30d": "30 days", all: "All time" }[r]}
            </a>
          ))}
        </div>

        {allEventNames.length === 0 || (eventRows?.length ?? 0) + activeEnrollments.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <p className="text-sm text-slate-300">
              No real commercial activity has been recorded yet for {rangeLabel.toLowerCase()}.
              <br />
              This dashboard will populate automatically as users interact with Ropes.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-4 text-base font-bold text-white">Search → Tool → Course → Payment → Proof funnel ({rangeLabel})</h3>
          <div className="space-y-3">
            {FUNNEL_STEPS.map((step) => {
              const implemented = step.events !== null;
              const count = implemented ? step.events!.reduce((s, e) => s + (eventCounts.get(e) ?? 0), 0) : null;
              const isEnrollment = step.label === "Enrollment activated";
              const displayCount = isEnrollment ? activeEnrollments.length : count;

              return (
                <div key={step.label} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{step.label}</span>
                    {implemented || isEnrollment ? (
                      <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-xs font-bold text-emerald-400">
                        {displayCount === 0 ? "0 (queried, none found)" : displayCount!.toLocaleString()}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-xs font-bold text-amber-400">EVENT NOT IMPLEMENTED</span>
                    )}
                  </div>
                  {step.note && <p className="mt-1.5 text-[11px] text-slate-500">{step.note}</p>}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] text-slate-500">
            No conversion percentages are shown between steps — most steps above are not yet instrumented, so a
            step-to-step rate would be manufactured, not measured.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-4 text-base font-bold text-white">₹50,000-tier reporting</h3>
          {coursesAt50k.length === 0 ? (
            <p className="text-sm text-slate-300">
              No course in the current catalog is priced at ₹50,000. Highest real list price: ₹{highestRealPrice.toLocaleString("en-IN")}.
              <br />
              <span className="text-slate-500">₹50K purchases observed: N/A — not applicable to the current catalog.</span>
            </p>
          ) : (
            <p className="text-sm text-slate-300">
              ₹50K purchases observed: {enrollmentsAt50k.length === 0 ? "No ₹50K purchase observed yet." : enrollmentsAt50k.length.toLocaleString()}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="mb-2 text-base font-bold text-white">Revenue observed ({rangeLabel})</h3>
          {activeEnrollments.length === 0 ? (
            <p className="text-sm text-slate-300">No paid enrollments observed yet for this period.</p>
          ) : (
            <>
              <p className="font-mono text-2xl font-bold text-emerald-400">₹{estimatedRevenue.toLocaleString("en-IN")}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Estimated from {activeEnrollments.length} active enrollment{activeEnrollments.length === 1 ? "" : "s"} × each course&apos;s current
                list price — sourced from the server-side <code className="text-slate-400">enrollments</code> table (only reachable via a
                signature-verified Razorpay payment), not from frontend analytics. This is an estimate, not the exact amount charged per
                transaction (promo codes and historical price changes aren&apos;t reconstructed) — the Razorpay dashboard remains the
                authoritative ledger for exact figures.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600">Based on real Ropes analytics and payment records. Data source: analytics_events, enrollments, courses tables.</p>
      </div>
    </main>
  );
}
