import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Award, CheckCircle2, Compass, FileCheck2, GraduationCap, Lock, Sparkles, Target } from "lucide-react";

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
import { IndustrySnapshot } from "@/components/marketing/industry-snapshot";
import { getIndustryData } from "@/lib/industry-data";
import type { CourseRow, ModuleRow } from "@/types/db";
import { getCourseDiscovery } from "@/lib/course-discovery";
import { breadcrumbJsonLd, ORGANIZATION_ID, pageMetadata, safeJsonLd, SITE_URL } from "@/lib/seo";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { PlainTerm } from "@/components/shared/plain-term";

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
  const description = course.description ?? `${course.title} course from Ropes.`;

  return pageMetadata({ title, description, path: `/courses/${params.slug}` });
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
  const discountedPrice = getDiscountedPrice(Number(course.price), course.slug);
  const industryData = getIndustryData(course.slug);
  const discovery = getCourseDiscovery(course.track, course.slug);
  const { data: capstoneData } = await supabase
    .from("course_capstones")
    .select("title, brief")
    .eq("course_id", course.id)
    .maybeSingle();

  // Public Course Value Preview — concrete, non-promissory. Built only from this course's
  // real module/capstone data, never a generic marketing claim.
  const deliverables = Array.from(new Set(modules.map((m) => m.build_deliverable).filter((d): d is string => Boolean(d))));
  const ownedArtifacts = [
    ...deliverables.map((d) => `A working project: ${d}`),
    ...(capstoneData ? [`A completed capstone: ${capstoneData.title}, scored across multiple dimensions`] : []),
    "A portfolio entry documenting how you built it, not just that you finished",
    "Verified skill evidence — tied to real work, not a self-rating",
  ];

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description ?? undefined,
    url: `${SITE_URL}/courses/${course.slug}`,
    provider: { "@type": "EducationalOrganization", "@id": ORGANIZATION_ID, name: "Ropes", url: SITE_URL },
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
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: `/courses/${course.slug}` },
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(courseJsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      <Section className="bg-primary bg-mesh-hero bg-noise pb-14 text-primary-foreground">
        <Container className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <MarketingBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Courses", href: "/courses" }, { label: course.title }]} />
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
              <CardContent className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">One-time course fee</p>
                  <PriceTag price={Number(course.price)} slug={course.slug} size="lg" />
                </div>
                <Button asChild size="lg" variant="accent" className="w-full sm:w-auto">
                  <Link href={`/checkout/${course.slug}`}>Enroll now <ArrowRight className="size-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            <Card><CardContent className="pt-6"><Target className="mb-3 size-5 text-accent-600" /><h2 className="font-heading text-lg font-semibold">Who should take this?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{discovery.audience}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><CheckCircle2 className="mb-3 size-5 text-success" /><h2 className="font-heading text-lg font-semibold">Capability developed</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{discovery.capability}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><FileCheck2 className="mb-3 size-5 text-primary" /><h2 className="font-heading text-lg font-semibold">Professional application</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{discovery.application}</p></CardContent></Card>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/40">
        <Container className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          {modules.length > 0 && <div>
            <h2 className="mb-5 font-heading text-h3 font-bold">What&rsquo;s inside this track</h2>
            <ul className="flex flex-col gap-3">
              {modules.map((module, i) => (
                <li key={module.id} className="rounded-lg border border-border bg-card px-4 py-4">
                  <div className="flex items-center gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{module.title}</span>
                  <Lock className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  {(module.build_deliverable || module.outcome) && <div className="ml-12 mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {module.build_deliverable && <p className="text-muted-foreground"><strong className="text-foreground">Build:</strong> {module.build_deliverable}</p>}
                    {module.outcome && <p className="text-muted-foreground"><strong className="text-foreground">Evidence:</strong> {module.outcome}</p>}
                  </div>}
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

      <Section>
        <Container>
          <h2 className="mb-2 font-heading text-h3 font-bold">What you will own</h2>
          <p className="mb-6 max-w-2xl text-muted-foreground">
            Not a promise — a concrete list of what you personally build and can show a buyer, pulled from this
            course&rsquo;s real curriculum.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ownedArtifacts.map((item) => (
              <li key={item} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="bg-muted/40">
        <Container>
          <h2 className="mb-2 font-heading text-h3 font-bold">What you&rsquo;ll prove — and own — by the end</h2>
          <p className="mb-6 max-w-2xl text-muted-foreground">
            Completion isn&rsquo;t the finish line. This is what turns the course into evidence you can
            actually use.
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <Compass className="mb-3 size-5 text-accent-600" />
                <h3 className="font-heading text-base font-semibold">Personalised from day one</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A short entry diagnostic flags which modules to move through quickly and which to slow
                  down on — the full curriculum stays available either way.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Sparkles className="mb-3 size-5 text-accent-600" />
                <h3 className="font-heading text-base font-semibold">Evidence, not checkmarks</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Skills track through a real mastery ladder — module completed, exercise practiced,
                  project shipped — not just &ldquo;lesson viewed.&rdquo;
                </p>
              </CardContent>
            </Card>
            {capstoneData ? (
              <Card>
                <CardContent className="pt-6">
                  <GraduationCap className="mb-3 size-5 text-accent-600" />
                  <h3 className="font-heading text-base font-semibold">
                    Your <PlainTerm term="capstone" className="inline-flex" />, AI-defended
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{capstoneData.title} — submit
                    real work, defend your decisions to an AI interviewer, get scored feedback across
                    multiple dimensions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <GraduationCap className="mb-3 size-5 text-accent-600" />
                  <h3 className="font-heading text-base font-semibold">Project workspace built in</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Log the decisions behind what you build — the reasoning becomes interview-ready proof,
                    not just a finished artifact.
                  </p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-6">
                <Award className="mb-3 size-5 text-accent-600" />
                <h3 className="font-heading text-base font-semibold">A portfolio you can use today</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Turn a finished project into a case study, resume bullets, and an interview story —
                  drafted from your real work, yours to review before you use it anywhere.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div><h2 className="font-heading text-h3 font-bold">Connect this course to practical work</h2><p className="mt-2 max-w-2xl text-muted-foreground">See how Ropes links a skill to a business problem, portfolio proof, a bounded service, and responsible client delivery. No client or income outcome is guaranteed.</p></div>
          <div className="flex flex-wrap gap-3">{discovery.skillSlug && <Button asChild variant="outline"><Link href={`/resources/skills/${discovery.skillSlug}`}>Understand the skill</Link></Button>}<Button asChild variant="accent"><Link href="/turn-skills-into-freelance-services">See the service pathway <ArrowRight className="size-4" /></Link></Button></div>
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

      {industryData && (
        <Section>
          <Container>
            <IndustrySnapshot data={industryData} />
          </Container>
        </Section>
      )}
    </div>
  );
}
