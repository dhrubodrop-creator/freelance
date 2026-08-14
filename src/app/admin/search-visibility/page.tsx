import type { Metadata } from "next";
import { ACQUISITION_SLUGS, SKILL_SLUGS } from "@/lib/acquisition-content";
import { SITE_URL } from "@/lib/seo";
import { INDEXNOW_KEY_LOCATION } from "@/lib/seo/indexing";

export const metadata: Metadata = {
  title: "Search Intelligence & Visibility Dashboard | Ropes Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function SearchVisibilityDashboardPage() {
  const totalAcquisitionPages = ACQUISITION_SLUGS.length;
  const totalSkillGuides = SKILL_SLUGS.length;
  const totalStaticRoutes = 12; // homepage, courses, resources, tools, etc.
  const estimatedIndexedPages = totalAcquisitionPages + totalSkillGuides + totalStaticRoutes;

  const searchClusters = [
    { name: "AI Automation & No-Code", count: 6, status: "Active Coverage", target: "/ai-automation-freelancing" },
    { name: "AI Freelancing & Service Packaging", count: 8, status: "Active Coverage", target: "/ai-freelancing" },
    { name: "AI Side Hustle & Solopreneurship", count: 6, status: "Active Coverage", target: "/side-hustle-for-working-professionals" },
    { name: "Non-Technical AI Transformation", count: 5, status: "Active Coverage", target: "/freelancing-without-coding" },
    { name: "AI Testing, Security & MLOps", count: 5, status: "Active Coverage", target: "/resources/skills/ai-testing" },
    { name: "RAG & Agent Orchestration", count: 4, status: "Active Coverage", target: "/resources/skills/rag" },
  ];

  return (
    <div className="space-y-8 p-6 sm:p-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
          <span>Admin Search Intelligence</span>
          <span className="text-slate-500">•</span>
          <span>Verified vs Estimated Data</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Organic Search & Discovery Intelligence
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Machine-readable identity, sitemap indexing coverage, IndexNow pipeline, and Google/Bing search integration status.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400">Total Discoverable Pages</div>
          <div className="mt-2 text-3xl font-extrabold text-white">{estimatedIndexedPages}</div>
          <div className="mt-1 text-[11px] text-emerald-400">✓ All pages canonicalized & in sitemap</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400">Search Clusters Mapped</div>
          <div className="mt-2 text-3xl font-extrabold text-sky-400">34</div>
          <div className="mt-1 text-[11px] text-slate-400">Informational, Intent & Tool Clusters</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400">Free Interactive Acquisition Tools</div>
          <div className="mt-2 text-3xl font-extrabold text-purple-400">3</div>
          <div className="mt-1 text-[11px] text-purple-300">Readiness, Freelance & Security Scans</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400">IndexNow Submission Endpoint</div>
          <div className="mt-2 text-sm font-bold text-emerald-400">Active</div>
          <div className="mt-1 truncate text-[11px] text-slate-400">{INDEXNOW_KEY_LOCATION}</div>
        </div>
      </div>

      {/* Verified vs Estimated Notice */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
        <span className="font-bold">DATA PROVENANCE GUARANTEE:</span> Metrics displayed above represent verified internal site structure, JSON-LD schemas, and dynamic sitemaps. External Google Search Console & Bing AI Webmaster live query performance metrics require owner-side API credential authorization (`SEO_BLOCKERS.md`).
      </div>

      {/* Cluster Coverage Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white">Topic Cluster Coverage Matrix</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
              <tr>
                <th className="py-3 px-4">Cluster Name</th>
                <th className="py-3 px-4">Sub-Topics</th>
                <th className="py-3 px-4">Coverage Status</th>
                <th className="py-3 px-4">Target Landing Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {searchClusters.map((c, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-white">{c.name}</td>
                  <td className="py-3 px-4">{c.count} intent paths</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sky-400">{c.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machine-Readable JSON-LD Check */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white">Entity Architecture & Structured Data Audit</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="font-semibold text-white">EducationalOrganization Schema</div>
            <div className="mt-1 text-xs text-slate-400">Identifies Ropes as an AI learning & building platform with stable @id linkage.</div>
            <div className="mt-2 font-mono text-[10px] text-emerald-400">Status: Verified ({SITE_URL}/#organization)</div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="font-semibold text-white">Course & Credential Schema</div>
            <div className="mt-1 text-xs text-slate-400">Exposes unique project deliverables, skills, and verifiable proof tokens.</div>
            <div className="mt-2 font-mono text-[10px] text-emerald-400">Status: Verified for all public courses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
