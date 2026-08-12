import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/shared/price-tag";
import { getCourseVisual } from "@/components/marketing/course-visual";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getDiscountedPrice } from "@/lib/pricing";
import { getEarningsIllustration } from "@/components/marketing/earnings-illustration";
import { EarningsChart } from "@/components/marketing/earnings-chart";
import type { CourseRow, ModuleRow } from "@/types/db";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("courses")
    .select("title, description, track")
    .eq("slug", params.slug)
    .maybeSingle();
  const course = data as Pick<CourseRow, "title" | "description" | "track"> | null;
  if (!course) return { title: "Course" };

  const title = `${course.title} — AI Course for Freelancers & Solo Entrepreneurs`;
  const description = course.description
    ? `${course.description} A Ropes AI course for freelancers and solo entrepreneurs — AI-mentored, project-based, client-ready.`
    : undefined;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = supabaseAdmin();

  const { data: courseData } = await supabase.from("courses").select("*").eq("slug", params.slug).maybeSingle();
  const course = courseData as CourseRow | null;

  if (!course) notFound();
  const courseVisual = getCourseVisual(course.slug);

  const { data: moduleData } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });
  const modules = (moduleData ?? []) as ModuleRow[];
  const discountedPrice = getDiscountedPrice(Number(course.price));

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description ?? undefined,
    provider: { "@type": "EducationalOrganization", name: "Ropes", sameAs: process.env.NEXT_PUBLIC_SITE_URL },
    audience: { "@type": "Audience", audienceType: "Freelancers, solo entrepreneurs, working professionals" },
    offers: {
      "@type": "Offer",
      price: discountedPrice,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      category: "Paid",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `P${modules.length}W`,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <Section className="bg-primary bg-mesh-hero bg-noise pb-14 text-primary-foreground">
        <Container className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-5">
            {course.track && (
              <Badge variant="accent" className="w-fit capitalize">
                {course.track.replace(/-/g, " ")}
              </Badge>
            )}
            <h1 className="text-balance font-heading text-h1 font-bold">{course.title}</h1>
            <p className="max-w-xl text-body-lg text-white/75">{course.description}</p>
          </div>

          <div className="cinematic-frame relative overflow-hidden rounded-2xl border border-white/15 bg-primary shadow-lifted">
            <div className="relative aspect-[4/3]">
              <Image src={courseVisual.src} alt={courseVisual.alt} fill priority sizes="(max-width: 1023px) 100vw, 48vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
            </div>
            <Card className="absolute inset-x-4 bottom-4 border-white/15 bg-white/95 text-card-foreground shadow-lifted sm:inset-x-6 sm:bottom-6">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">One-time course fee</p>
                  <PriceTag price={Number(course.price)} size="lg" />
                </div>
                <Button asChild size="lg" variant="accent">
                  <Link href={`/checkout/${course.slug}`}>Enroll now <ArrowRight className="size-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          {modules.length > 0 && <div>
            <h2 className="mb-5 font-heading text-h3 font-bold">What&rsquo;s inside this track</h2>
            <ul className="flex flex-col gap-3">
              {modules.map((module, i) => (
                <li key={module.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{module.title}</span>
                  <Lock className="size-4 shrink-0 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </div>}

          <div className={modules.length === 0 ? "flex flex-col gap-4 lg:col-span-2" : "flex flex-col gap-4"}>
            <h2 className="font-heading text-h4 font-bold">What you get</h2>
            {[
              "Structured, hands-on modules",
              "Templates and playbooks to reuse with clients",
              "AI mentor support inside the portal",
              "Community access alongside other students",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/40">
        <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="max-w-2xl">
            <h2 className="font-heading text-h3 font-bold">Earnings potential</h2>
            <p className="mt-2 text-muted-foreground">
              A simple illustration of how freelancers commonly structure retainer pricing once they&rsquo;re
              taking on client work.
            </p>
            <div className="mt-6 relative aspect-[16/10] overflow-hidden rounded-2xl shadow-card">
              <Image src="/images/ropes/proof-workbench.webp" alt="Client system notes beside an automation workflow and payment confirmation" fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/55 to-transparent" />
            </div>
          </div>
          <Card>
            <CardContent>
              <EarningsChart illustration={getEarningsIllustration(course.track)} />
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
