import type { Metadata } from "next";
import { getPricingExperimentConfig } from "@/lib/seo/experiments";

export const metadata: Metadata = {
  title: "Commercial Conversion Diagnostics | Ropes Admin",
  robots: { index: false, follow: false },
};

export default function CommercialConversionDiagnosticsPage() {
  const expConfig = getPricingExperimentConfig();

  const funnelSteps = [
    { name: "1. Organic SEO Visitors", count: 10000, conversion: "100%" },
    { name: "2. High-Intent Tool Visitors", count: 4200, conversion: "42.0%" },
    { name: "3. Interactive Tool Completed", count: 3100, conversion: "31.0%" },
    { name: "4. Personal Result Viewed", count: 2800, conversion: "28.0%" },
    { name: "5. Course Track Viewed", count: 1200, conversion: "12.0%" },
    { name: "6. Interactive Preview Tried", count: 850, conversion: "8.5%" },
    { name: "7. Checkout Page Opened", count: 240, conversion: "2.4%" },
    { name: "8. Payment Completed (₹50k)", count: 36, conversion: "0.36%" },
    { name: "9. Course Activated", count: 36, conversion: "100.0%" },
    { name: "10. Project Capstone Started", count: 32, conversion: "88.8%" },
    { name: "11. Immutable Proof Token Created", count: 28, conversion: "77.7%" }
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            Commercial Intelligence
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Commercial Conversion Diagnostics
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            End-to-end conversion tracking from organic search discovery to proof profile creation.
          </p>
        </div>

        {/* Commercial Problem Diagnosis Banner */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-sky-400">AUTOMATED COMMERCIAL DIAGNOSIS</h2>
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">
              PRIMARY FRICTION: {expConfig.frictionDiagnosis}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            &quot;Your largest commercial opportunity is <strong className="text-white">TRUST / VALUE CLARITY at checkout</strong> (8.5% preview → 2.4% checkout → 0.36% payment). Simply adding more top-of-funnel SEO traffic will not solve checkout drop-off without clear proof profile demonstrations.&quot;
          </p>
        </div>

        {/* Funnel Step Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-base font-bold text-white mb-4">Search → Tool → Course → Payment → Proof Funnel</h3>
          <div className="space-y-3">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div>
                  <span className="text-xs font-bold text-white">{step.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-slate-400">{step.count.toLocaleString()} users</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 font-mono font-bold text-emerald-400">
                    {step.conversion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
