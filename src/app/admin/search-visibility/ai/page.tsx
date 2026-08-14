import type { Metadata } from "next";
import { AI_SEARCH_QUERIES } from "@/lib/seo/ai-search";

export const metadata: Metadata = {
  title: "AI Search Visibility & Citation Monitoring | Ropes Admin",
  robots: { index: false, follow: false },
};

export default function AiSearchAdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
            AI Search Visibility Engine
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI Search & LLM Citation Tracker
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitoring brand citations across SearchGPT, Perplexity, ChatGPT, Gemini, and Bing Copilot.
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-purple-400">HONEST AI CITATION POLICY</h2>
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
              UNSIMULATED
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Ropes never simulates LLM responses or claims unverified ChatGPT rankings. Citations are recorded when real search bot API responses or manual LLM query audits confirm URL citation.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900 text-slate-400">
              <tr>
                <th className="p-4">Target Conversational Query</th>
                <th className="p-4">Engine</th>
                <th className="p-4">Cited URL</th>
                <th className="p-4 text-center">Citation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {AI_SEARCH_QUERIES.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-white">{item.promptQuery}</td>
                  <td className="p-4 text-purple-400 font-medium">{item.engine}</td>
                  <td className="p-4 text-slate-400 font-mono">{item.citedUrl ?? "—"}</td>
                  <td className="p-4 text-center">
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-micro font-bold text-slate-300">
                      {item.status}
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
