import { Container, Section } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CaseStudyRow } from "@/types/db";

export const revalidate = 3600;

export const metadata = {
  title: "Case Studies",
  description: "Stories from Ropes students building independent AI no-code practices.",
};

export default async function CaseStudiesPage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("case_studies").select("*").order("created_at", { ascending: false });
  const caseStudies = (data ?? []) as CaseStudyRow[];

  return (
    <div>
      <Section className="relative overflow-hidden bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <div className="absolute inset-y-0 right-0 w-full opacity-40 sm:w-3/5">
          <Image src="/images/ropes/proof-workbench.webp" alt="" fill priority sizes="(max-width: 639px) 100vw, 60vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />
        </div>
        <Container className="relative py-8">
          <span className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-accent"><Sparkles className="size-3.5" /> Proof, with context</span>
          <h1 className="mt-4 max-w-2xl font-heading text-h1 font-bold">The work behind independence</h1>
          <p className="mt-3 max-w-xl text-body-lg text-white/75">Honest stories about learning the tools, building the first system, and turning professional experience into client value.</p>
        </Container>
      </Section>

      <Section>
        <Container>
        {caseStudies.length === 0 ? (
          <Card className="mx-auto max-w-2xl overflow-hidden py-0">
            <div className="relative h-64">
              <Image src="/images/ropes/proof-workbench.webp" alt="A real-world AI automation workbench" fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            </div>
            <CardContent className="flex flex-col gap-3 py-6 text-center">
              <h2 className="font-heading text-h4 font-semibold">First cohort stories are being documented.</h2>
              <p className="text-sm text-muted-foreground">We publish named outcomes only with student permission. No invented testimonials, no stock-photo stand-ins.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {caseStudies.map((study) => (
              <Card key={study.id} className="overflow-hidden py-0">
                {study.image_url ? (
                  <div className="relative h-56"><Image src={study.image_url} alt={study.title} fill unoptimized sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" /></div>
                ) : (
                  <div className="relative h-56">
                    <Image src="/images/ropes/proof-workbench.webp" alt="Editorial illustration of hands-on AI automation work" fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/75 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-primary/75 px-3 py-1 text-micro font-medium text-white backdrop-blur-sm">Visual illustration · not a student portrait</span>
                  </div>
                )}
                <CardContent className="flex flex-col gap-2 py-5">
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
import Image from "next/image";
import { Quote, Sparkles } from "lucide-react";
