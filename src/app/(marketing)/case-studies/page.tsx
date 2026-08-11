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
    <Section>
      <Container>
        <div className="mb-12 max-w-2xl">
          <h1 className="font-heading text-h1 font-bold">Case studies</h1>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Stories from students on what it&rsquo;s like to move from a day job into independent client work.
          </p>
        </div>

        {caseStudies.length === 0 ? (
          <p className="text-muted-foreground">Case studies will appear here soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {caseStudies.map((study) => (
              <Card key={study.id} className="overflow-hidden py-0">
                {study.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={study.image_url} alt={study.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 w-full bg-mesh-hero bg-primary bg-noise" aria-hidden="true" />
                )}
                <CardContent className="flex flex-col gap-2 py-5">
                  <h2 className="font-heading text-lg font-semibold">{study.title}</h2>
                  <p className="text-sm text-muted-foreground">{study.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
