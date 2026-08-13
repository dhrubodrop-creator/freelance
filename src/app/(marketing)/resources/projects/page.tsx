import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";

import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { Container, Section } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_BRIEFS } from "@/lib/acquisition-content";
import { breadcrumbJsonLd, pageMetadata, safeJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({ title: "AI Portfolio Project Briefs for Practical, Client-Ready Work", description: "Public AI portfolio project briefs showing the problem, approach, deliverable, relevant skill, and Ropes course—without exposing private learner work.", path: "/resources/projects" });

export default function ProjectsPage() {
  const breadcrumb = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Resources", path: "/resources" }, { name: "Project briefs", path: "/resources/projects" }]);
  return <div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} /><Section className="bg-primary text-primary-foreground"><Container><MarketingBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Resources", href: "/resources" }, { label: "Project briefs" }]} /><span className="text-micro font-semibold uppercase tracking-wide text-accent">Proof before promotion</span><h1 className="mt-4 max-w-4xl font-heading text-h1 font-bold">Portfolio project briefs for practical AI work</h1><p className="mt-5 max-w-3xl text-body-lg text-white/75">These are original public briefs derived from the capabilities taught in Ropes. They are not student submissions, client case studies, or promises of commercial results.</p></Container></Section><Section><Container><div className="grid gap-6 lg:grid-cols-2">{PROJECT_BRIEFS.map((project) => <Card key={project.title}><CardHeader><div className="mb-2 flex items-center justify-between gap-3"><Badge variant="accent">{project.skill}</Badge><FileCheck2 className="size-5 text-accent-600" /></div><CardTitle>{project.title}</CardTitle></CardHeader><CardContent className="flex flex-col gap-4 text-sm"><div><strong className="font-heading">Problem</strong><p className="mt-1 text-muted-foreground">{project.problem}</p></div><div><strong className="font-heading">Approach</strong><p className="mt-1 text-muted-foreground">{project.approach}</p></div><div><strong className="font-heading">Portfolio deliverable</strong><p className="mt-1 text-muted-foreground">{project.deliverable}</p></div><div className="flex flex-wrap gap-2 pt-2"><Button asChild variant="outline" size="sm"><Link href={`/resources/skills/${project.skillSlug}`}>Understand the skill</Link></Button><Button asChild size="sm"><Link href={`/courses/${project.courseSlug}`}>Relevant course <ArrowRight className="size-4" /></Link></Button></div></CardContent></Card>)}</div></Container></Section></div>;
}
