import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { InteractiveCoursePreview } from "@/components/marketing/interactive-course-preview";
import { ValueBreakdownCard } from "@/components/marketing/value-breakdown-card";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Experience Ropes Product & System Preview | Ropes",
  description: "Test Ropes' daily missions, 24/7 AI mentor guidance, verification labs, and immutable proof evidence engine before enrolling.",
  path: "/preview"
});

export default function PreviewPage() {
  return (
    <div className="bg-slate-950 py-16 text-slate-100">
      <Container className="space-y-12">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1 text-xs font-semibold text-sky-400">
            100% Non-Gated Product Transparency
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            See Exactly What You Build & Own
          </h1>
          <p className="text-base text-slate-300">
            Ropes believes in total transparency. Experience our interactive learning environment, automated verification labs, and proof profile engine before making any decision.
          </p>
        </div>

        <InteractiveCoursePreview />

        <ValueBreakdownCard />
      </Container>
    </div>
  );
}
