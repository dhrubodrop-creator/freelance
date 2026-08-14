import type { Metadata } from "next";
import { getBingObservabilityStatus } from "@/lib/seo/bing";

export const metadata: Metadata = {
  title: "Bing Indexing Observability | Ropes Admin",
  robots: { index: false, follow: false },
};

export default function BingSearchObservabilityPage() {
  const status = getBingObservabilityStatus();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            Search Visibility Engine
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Bing Indexing Observability
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tracking IndexNow API submission vs Bingbot crawl and indexing verification.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">IndexNow Submission Pipeline</h2>
              <p className="text-xs text-slate-400">Submission key verification active at /api/indexing/indexnow</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              {status.indexNowAccepted} URLs ACCEPTED
            </span>
          </div>
        </div>

        {!status.isConnected ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <h2 className="text-xl font-bold text-amber-400">BING WEBMASTER API NOT CONNECTED</h2>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                SETUP REQUIRED
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              IndexNow submission confirmation (ACCEPTED) is separate from search indexing (INDEXED). Live crawl data requires Bing Webmaster API credentials.
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
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{status.indexNowAccepted}</div>
              <div className="mt-1 text-xs font-semibold uppercase text-slate-400">INDEXNOW ACCEPTED</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <div className="text-2xl font-bold text-white">{status.crawled}</div>
              <div className="mt-1 text-xs font-semibold uppercase text-slate-400">CRAWLED</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <div className="text-2xl font-bold text-white">{status.indexed}</div>
              <div className="mt-1 text-xs font-semibold uppercase text-slate-400">INDEXED</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <div className="text-2xl font-bold text-white">{status.excluded}</div>
              <div className="mt-1 text-xs font-semibold uppercase text-slate-400">EXCLUDED</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
