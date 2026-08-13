import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, FileCheck2 } from "lucide-react";

import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { Container, Section } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SKILL_GUIDES, SKILL_SLUGS } from "@/lib/acquisition-content";
import { breadcrumbJsonLd, CONTENT_UPDATED_AT, pageMetadata, safeJsonLd, SITE_URL } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow } from "@/types/db";

type Props = { params: { slug: string } };
export function generateStaticParams() { return SKILL_SLUGS.map((slug) => ({ slug })); }
export function generateMetadata({ params }: Props) { const skill = SKILL_GUIDES[params.slug]; if (!skill) return {}; return pageMetadata({ title: `${skill.name}: Skills, Portfolio & Professional Applications`, description: `${skill.definition} Learn what to build, how to prove the capability, and which Ropes courses develop it.`, path: `/resources/skills/${skill.slug}` }); }

export default async function SkillGuidePage({ params }: Props) {
  const skill = SKILL_GUIDES[params.slug]; if (!skill) notFound();
  const supabase = supabaseAdmin(); const { data } = await supabase.from("courses").select("id, slug, title, track, description").in("slug", skill.courseSlugs);
  const courseMap = new Map(((data ?? []) as CourseRow[]).map((course) => [course.slug, course])); const courses = skill.courseSlugs.map((slug) => courseMap.get(slug)).filter(Boolean) as CourseRow[];
  const structured = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name: skill.name, description: skill.definition, url: `${SITE_URL}/resources/skills/${skill.slug}`, inDefinedTermSet: `${SITE_URL}/resources/skills`, dateModified: CONTENT_UPDATED_AT }, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/resources" }, { name: "Skills", path: "/resources#skills" }, { name: skill.name, path: `/resources/skills/${skill.slug}` }])];
  return <div>{structured.map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(item) }} />)}
    <Section className="bg-primary text-primary-foreground"><Container><MarketingBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Resources", href: "/resources" }, { label: "Skills", href: "/resources#skills" }, { label: skill.name }]} /><span className="text-micro font-semibold uppercase tracking-wide text-accent">Skill guide</span><h1 className="mt-4 max-w-4xl font-heading text-h1 font-bold">{skill.name}</h1><p className="mt-5 max-w-3xl text-body-lg text-white/75">{skill.definition}</p></Container></Section>
    <Section><Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"><div><h2 className="font-heading text-h2 font-bold">Why this capability matters</h2><p className="mt-4 text-lg leading-8 text-muted-foreground">{skill.whyItMatters}</p><h2 className="mt-10 font-heading text-h3 font-bold">What competent practice includes</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{skill.capabilities.map((item) => <div key={item} className="flex gap-2.5 rounded-lg border border-border p-4 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />{item}</div>)}</div></div><Card className="border-accent/30 bg-accent-50"><CardHeader><FileCheck2 className="mb-2 size-6 text-accent-600" /><CardTitle>Portfolio evidence</CardTitle></CardHeader><CardContent><p className="leading-7 text-muted-foreground">{skill.portfolio}</p><Button asChild variant="outline" className="mt-5"><Link href="/resources/projects">See public project briefs <ArrowRight className="size-4" /></Link></Button></CardContent></Card></Container></Section>
    <Section className="bg-muted/40"><Container><h2 className="font-heading text-h2 font-bold">Professional applications</h2><p className="mt-3 max-w-2xl text-muted-foreground">These are fields of application, not guaranteed job or income outcomes.</p><div className="mt-6 flex flex-wrap gap-3">{skill.applications.map((item) => <span key={item} className="rounded-full border border-border bg-card px-4 py-2 text-sm">{item}</span>)}</div></Container></Section>
    {courses.length > 0 && <Section><Container><h2 className="font-heading text-h2 font-bold">Courses that develop this skill</h2><div className="mt-7 grid gap-5 md:grid-cols-2">{courses.map((course) => <Card key={course.id}><CardHeader>{course.track && <Badge variant="accent" className="mb-2 w-fit">{course.track}</Badge>}<CardTitle>{course.title}</CardTitle><CardDescription>{course.description}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={`/courses/${course.slug}`}>See modules and project outcomes <ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</div></Container></Section>}
    <Section className="bg-primary text-primary-foreground"><Container className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div><h2 className="font-heading text-h3 font-bold">Connect the skill to a market path</h2><p className="mt-2 max-w-2xl text-white/70">Learn how this capability fits inside a complete problem, proof, service, and delivery journey.</p></div><Button asChild variant="accent"><Link href={skill.relatedPath}>Read the connected guide <ArrowRight className="size-4" /></Link></Button></Container></Section>
  </div>;
}
