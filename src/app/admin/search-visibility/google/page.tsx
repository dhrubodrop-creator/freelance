import type { Metadata } from "next";
import { getGscObservabilityStatus } from "@/lib/seo/gsc";

export const metadata: Metadata = {
  title: "Google Indexing Observability | Ropes Admin",
  robots: { index: false, follow: false },
};

export default function GoogleSearchObservabilityPage() {
  const status = getGscObservabilityStatus();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            Search Visibility Engine
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Google Indexing Observability
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time tracking of Search Console URL inspection, crawl state, and index coverage.
          </p>
        </div>

        {!status.isConnected ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-bold text-amber-400">GOOGLE SEARCH CONSOLE NOT CONNECTED</h2>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                SETUP REQUIRED
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              In accordance with strict provenance rules, Ropes never fabricates index metrics without authentic API data.
            </p>
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-white">Setup Instructions to Connect Real Data:</h3>
              <ul className="space-y-2 text-xs font-mono text-slate-300">
                {status.instructions.map((step, idx) => (
                  <li key={idx} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-5">
            {Object.entries(status.summary).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <div className="text-2xl font-bold text-white">{val}</div>
                <div className="mt-1 text-xs font-semibold uppercase text-slate-400">{key}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
