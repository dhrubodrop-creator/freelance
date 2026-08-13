import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Lightbulb, ShieldAlert } from "lucide-react";

import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { Container, Section } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACQUISITION_PAGES, SKILL_GUIDES, type AcquisitionPage } from "@/lib/acquisition-content";
import { breadcrumbJsonLd, CONTENT_UPDATED_AT, safeJsonLd, SITE_URL } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow } from "@/types/db";

export async function AcquisitionPageTemplate({ page }: { page: AcquisitionPage }) {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("courses").select("id, slug, title, track, description").in("slug", page.courseSlugs);
  const courseMap = new Map(((data ?? []) as CourseRow[]).map((course) => [course.slug, course]));
  const courses = page.courseSlugs.map((slug) => courseMap.get(slug)).filter(Boolean) as CourseRow[];

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Resources", path: "/resources" },
    { name: page.title, path: `/${page.slug}` },
  ]);
  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${SITE_URL}/${page.slug}`,
    datePublished: CONTENT_UPDATED_AT,
    dateModified: CONTENT_UPDATED_AT,
    inLanguage: "en-IN",
    isPartOf: { "@type": "WebSite", name: "Ropes", url: SITE_URL },
    publisher: { "@type": "EducationalOrganization", name: "Ropes", url: SITE_URL },
    about: page.skillSlugs.map((slug) => ({ "@type": "DefinedTerm", name: SKILL_GUIDES[slug]?.name ?? slug })),
  };

  return (
    <div>
      {[breadcrumb, webpage].map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(item) }} />
      ))}

      <Section className="bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <Container className="py-6 sm:py-10">
          <MarketingBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Resources", href: "/resources" }, { label: page.eyebrow }]} />
          <div className="max-w-4xl">
            <span className="text-micro font-semibold uppercase tracking-wide text-accent">{page.eyebrow}</span>
            <h1 className="mt-4 text-balance font-heading text-h1 font-bold">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-body-lg text-white/75">{page.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg"><Link href="/courses">Explore relevant courses <ArrowRight className="size-4" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/webinar">See how Ropes works</Link></Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div>
            <span className="text-micro font-semibold uppercase tracking-wide text-accent-600">Direct answer</span>
            <h2 className="mt-2 font-heading text-h2 font-bold">What this path actually means</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{page.directAnswer}</p>
          </div>
          <Card className="border-accent/30 bg-accent-50/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Compass className="size-5 text-accent-600" /> Who this is for</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {page.whoFor.map((item) => <div key={item} className="flex gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /><span>{item}</span></div>)}
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="bg-muted/40">
        <Container>
          <div className="mb-9 max-w-2xl"><h2 className="font-heading text-h2 font-bold">The foundations</h2><p className="mt-3 text-muted-foreground">The useful capability sits at the intersection of domain judgment, system design, proof, and responsible delivery.</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {page.principles.map((item) => <Card key={item.title}><CardHeader><Lightbulb className="mb-2 size-5 text-accent-600" /><CardTitle className="text-lg">{item.title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{item.description}</p></CardContent></Card>)}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mb-9 max-w-2xl"><h2 className="font-heading text-h2 font-bold">A practical workflow</h2><p className="mt-3 text-muted-foreground">Move from a familiar problem to an inspectable piece of work before trying to sell a broad transformation.</p></div>
          <ol className="grid gap-4 md:grid-cols-5">
            {page.workflow.map((item, index) => <li key={item.title} className="rounded-xl border border-border bg-card p-5"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{index + 1}</span><h3 className="mt-4 font-heading font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></li>)}
          </ol>
        </Container>
      </Section>

      <Section className="bg-primary text-primary-foreground">
        <Container>
          <h2 className="font-heading text-h2 font-bold">Problem → build → possible service</h2>
          <p className="mt-3 max-w-2xl text-white/70">These are capability examples, not income promises. A real offer must be validated with a specific market and delivered within your competence.</p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-white/15">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/10"><tr><th className="p-4 font-semibold">Business need</th><th className="p-4 font-semibold">Portfolio build</th><th className="p-4 font-semibold">Potential service</th></tr></thead>
              <tbody>{page.examples.map((example) => <tr key={example.need} className="border-t border-white/10"><td className="p-4 text-white/80">{example.need}</td><td className="p-4 text-white/80">{example.build}</td><td className="p-4 text-white/80">{example.service}</td></tr>)}</tbody>
            </table>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-10 lg:grid-cols-2">
          <div><h2 className="font-heading text-h3 font-bold">Skills to understand next</h2><div className="mt-5 flex flex-col gap-3">{page.skillSlugs.map((slug) => { const skill = SKILL_GUIDES[slug]; return skill ? <Link key={slug} href={`/resources/skills/${slug}`} className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-accent/50 hover:shadow-card"><span><strong className="font-heading">{skill.name}</strong><span className="mt-1 block text-sm text-muted-foreground">{skill.definition}</span></span><ArrowRight className="ml-4 size-4 shrink-0 transition-transform group-hover:translate-x-1" /></Link> : null; })}</div></div>
          <div><h2 className="font-heading text-h3 font-bold">Mistakes to avoid</h2><div className="mt-5 flex flex-col gap-3">{page.mistakes.map((item) => <div key={item} className="flex gap-3 rounded-xl border border-border p-4 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" /><span>{item}</span></div>)}</div></div>
        </Container>
      </Section>

      {courses.length > 0 && <Section className="bg-muted/40"><Container><div className="mb-8 max-w-2xl"><h2 className="font-heading text-h2 font-bold">Relevant Ropes learning paths</h2><p className="mt-3 text-muted-foreground">These courses connect the concepts above to structured modules and concrete builds. Choose based on the work you want to be able to deliver.</p></div><div className="grid gap-5 md:grid-cols-3">{courses.map((course) => <Card key={course.id} className="flex flex-col"><CardHeader className="flex-1">{course.track && <Badge variant="accent" className="mb-2 w-fit">{course.track}</Badge>}<CardTitle className="text-lg">{course.title}</CardTitle><CardDescription>{course.description}</CardDescription></CardHeader><CardContent><Button asChild variant="outline" size="sm"><Link href={`/courses/${course.slug}`}>See curriculum and builds <ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</div></Container></Section>}

      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div><h2 className="font-heading text-h2 font-bold">Questions people ask</h2><div className="mt-6 flex flex-col gap-3">{page.faqs.map((faq) => <details key={faq.question} className="group rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer list-none font-heading font-semibold">{faq.question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></div>
          <aside><Card className="bg-primary text-primary-foreground"><CardHeader><CardTitle>Continue the journey</CardTitle><CardDescription className="text-white/65">Explore connected guides, then inspect the projects and curriculum behind the capability.</CardDescription></CardHeader><CardContent className="flex flex-col gap-2">{page.relatedPaths.map((path) => <Link key={path} href={path} className="flex items-center justify-between rounded-lg border border-white/15 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">{ACQUISITION_PAGES[path.slice(1)]?.title ?? (path === "/for-professionals" ? "AI pathways for professional functions" : "Public portfolio project briefs")}<ArrowRight className="size-4" /></Link>)}</CardContent></Card></aside>
        </Container>
      </Section>

      <Section className="bg-accent-50"><Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><h2 className="font-heading text-h3 font-bold">Build capability before making claims</h2><p className="mt-2 max-w-2xl text-muted-foreground">Ropes connects learning to systems, project evidence, and professional application. Outcomes vary; no course can guarantee clients or income.</p></div><Button asChild variant="accent" size="lg"><Link href="/webinar">Join the free walkthrough <ArrowRight className="size-4" /></Link></Button></Container></Section>
    </div>
  );
}
