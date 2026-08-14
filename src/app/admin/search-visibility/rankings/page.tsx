import type { Metadata } from "next";
import { TARGET_KEYWORDS } from "@/lib/seo/rankings";

export const metadata: Metadata = {
  title: "Ranking Intelligence | Ropes Admin",
  robots: { index: false, follow: false },
};

export default function RankingsAdminPage() {
  const isApiConnected = Boolean(process.env.GSC_CLIENT_EMAIL || process.env.SERP_API_KEY);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            Search Visibility Engine
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ranking Intelligence
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Target keyword query tracking across Search Console, Bing, and SERP APIs.
          </p>
        </div>

        {!isApiConnected && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400">UNMEASURED — CONNECT GSC / SERP API FOR LIVE POSITIONS</h2>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                PROVENANCE SAFEGUARD
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Ropes never fabricates search engine ranking positions. Connect Search Console API or SERP API credentials to view real impressions, clicks, and rank positions.
            </p>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900 text-slate-400">
              <tr>
                <th className="p-4">Target Search Query</th>
                <th className="p-4">Category</th>
                <th className="p-4">Target Route</th>
                <th className="p-4 text-center">Rank</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {TARGET_KEYWORDS.map((kw, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-white">{kw.query}</td>
                  <td className="p-4 text-slate-400">{kw.intentCategory}</td>
                  <td className="p-4 text-sky-400 font-mono">{kw.targetRoute}</td>
                  <td className="p-4 text-center text-slate-400">{kw.currentRank ?? "—"}</td>
                  <td className="p-4 text-center">
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-micro font-bold text-slate-300">
                      {kw.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
