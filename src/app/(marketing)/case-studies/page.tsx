import Image from "next/image";
import { Quote, ShieldCheck, Sparkles } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CaseStudyRow } from "@/types/db";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({ title: "Verified Ropes Student Case Studies", description: "Verified Ropes learner stories are published only with student approval and supporting context. No invented testimonials or stock-photo endorsements.", path: "/case-studies" });

export default async function CaseStudiesPage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("case_studies").select("*").order("created_at", { ascending: false });
  const caseStudies = (data ?? []) as CaseStudyRow[];
  const publishedCaseStudies = caseStudies.filter(
    (study) => study.summary && !study.summary.includes("[TESTIMONIAL PLACEHOLDER")
  );

  return (
    <div>
      <Section className="relative overflow-hidden bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <div className="absolute inset-y-0 right-0 w-full opacity-40 sm:w-3/5">
          <Image src="/images/ropes/proof-workbench.webp" alt="" fill priority sizes="(max-width: 639px) 100vw, 60vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />
        </div>
        <Container className="relative py-8">
          <span className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-accent">
            <Sparkles className="size-3.5" /> Proof, with context
          </span>
          <h1 className="mt-4 max-w-2xl font-heading text-h1 font-bold">The work behind independence</h1>
          <p className="mt-3 max-w-xl text-body-lg text-white/75">
            Verified stories about learning the tools, building the first system, and turning professional experience into client value.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          {publishedCaseStudies.length === 0 ? (
            <Card className="mx-auto max-w-2xl border-primary/10 bg-primary text-center text-primary-foreground shadow-lifted">
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <span className="flex size-12 items-center justify-center rounded-full bg-white/10">
                  <ShieldCheck className="size-6 text-accent" />
                </span>
                <h2 className="font-heading text-h4 font-semibold">Student outcomes are being independently verified.</h2>
                <p className="max-w-lg text-sm text-white/70">
                  Ropes publishes a story only after the student approves their name, result, and supporting context. Until then, nothing is presented as an endorsement.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {publishedCaseStudies.map((study) => (
                <Card key={study.id} className="overflow-hidden py-0">
                  {study.image_url && (
                    <div className="relative h-56">
                      <Image src={study.image_url} alt={study.title} fill unoptimized sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" />
                    </div>
                  )}
                  <CardContent className="flex flex-col gap-2 py-6">
                    <Quote className="size-5 text-accent-600" />
                    <h2 className="font-heading text-lg font-semibold">{study.title}</h2>
                    <p className="text-sm text-muted-foreground">{study.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}
