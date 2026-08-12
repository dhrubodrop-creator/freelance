import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, Compass, Layers, Quote, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/shared/price-tag";
import { getCourseVisual } from "@/components/marketing/course-visual";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CaseStudyRow, CourseRow } from "@/types/db";

export const revalidate = 3600;

export default async function HomePage() {
  const supabase = supabaseAdmin();

  const [{ data: courseData }, { data: caseStudyData }] = await Promise.all([
    supabase.from("courses").select("*").order("price", { ascending: true }),
    supabase.from("case_studies").select("*").order("created_at", { ascending: false }).limit(2),
  ]);

  const courses = (courseData ?? []) as CourseRow[];
  const caseStudies = (caseStudyData ?? []) as CaseStudyRow[];
  const featuredCourses = courses.slice(0, 3);
  const publishedCaseStudies = caseStudies.filter(
    (study) => study.summary && !study.summary.includes("[TESTIMONIAL PLACEHOLDER")
  );

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
          <Image
            src="/images/ropes/hero-independent.webp"
            alt="An Indian professional building an AI automation system from a home workspace"
            fill
            priority
            sizes="58vw"
            className="object-cover object-[70%_center] opacity-55 lg:object-center lg:opacity-90"
          />
          <div className="absolute inset-0 bg-primary/60 lg:hidden" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/35 to-primary/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/20" />
        </div>
        <Container className="relative grid min-h-[720px] items-center gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
          <div className="relative z-10 flex flex-col items-start gap-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-micro font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-accent" />
              AI no-code training for working professionals
            </span>

            <h1 className="max-w-3xl text-balance font-heading text-display-lg font-bold">
              Build the system.
              <br />
              <span className="text-accent">Own the outcome.</span>
            </h1>

            <p className="max-w-xl text-balance text-body-lg text-white/75">
              Learn practical AI no-code systems, turn them into client-ready work, and create your
              path to independence—without leaving your experience behind.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href="/webinar">
                  Start free webinar <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-micro text-white/65">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-accent" /> Built for Indian professionals</span>
              <span className="inline-flex items-center gap-1.5"><Bot className="size-3.5 text-accent" /> AI mentor in every track</span>
            </div>
          </div>

        </Container>
      </section>

      {/* Story / credibility */}
      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-accent-600">
              <Compass className="size-3.5" />
              Why Ropes exists
            </span>
            <h2 className="font-heading text-h2 font-bold">
              The skill gap isn&rsquo;t talent. It&rsquo;s a guided starting point.
            </h2>
            <p className="max-w-lg text-muted-foreground">
              AI and no-code tools have made it possible to build real, working systems — outreach
              agents, automations, internal tools — without a software engineering background. What&rsquo;s
              missing for most working professionals isn&rsquo;t capability, it&rsquo;s a structured path: what
              to learn first, what to build, and how to package that into something a client will pay
              for.
            </p>
            <p className="max-w-lg text-muted-foreground">
              Ropes is that path. Each track pairs hands-on modules with an AI mentor and templates
              pulled from real client work, so you&rsquo;re never starting from a blank page.
            </p>
          </div>

          <div className="cinematic-frame relative overflow-hidden rounded-2xl border border-border bg-primary shadow-lifted">
            <div className="relative aspect-[5/4] min-h-[380px]">
              <Image
                src="/images/ropes/proof-workbench.webp"
                alt="A hands-on AI automation workspace with client notes, chai, and a payment confirmation"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/5 to-transparent" />
            </div>
            <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-3 sm:inset-x-6 sm:bottom-6">
              <div className="rounded-xl border border-white/15 bg-primary/80 p-4 text-white backdrop-blur-md">
                <Layers className="mb-2 size-5 text-accent" />
                <p className="font-heading text-sm font-semibold">Build real systems</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-primary/80 p-4 text-white backdrop-blur-md">
                <Users className="mb-2 size-5 text-accent" />
                <p className="font-heading text-sm font-semibold">Package client value</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Offer overview */}
      <Section className="bg-muted/40">
        <Container>
          <div className="mb-12 flex flex-col items-center gap-3 text-center">
            <h2 className="font-heading text-h2 font-bold">Pick your track</h2>
            <p className="max-w-lg text-muted-foreground">
              Three guided paths, depending on where you&rsquo;re starting from and what you want to build.
            </p>
          </div>

          {courses.length === 0 ? (
            <Card className="mx-auto max-w-xl border-dashed text-center">
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <Compass className="size-7 text-accent-600" />
                <p className="font-heading font-semibold">Enrollment is between cohorts.</p>
                <p className="text-sm text-muted-foreground">Join the free webinar to see the method and hear when enrollment opens.</p>
                <Button asChild variant="outline" size="sm"><Link href="/webinar">Reserve a free seat</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {featuredCourses.map((course) => {
                const visual = getCourseVisual(course.slug);
                return (
                <Card key={course.id} className="group flex flex-col justify-between overflow-hidden py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
                  <div>
                    <div className="relative aspect-[16/9] overflow-hidden bg-primary">
                      <Image src={visual.src} alt={visual.alt} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-transparent" />
                    </div>
                    <CardHeader className="pt-5">
                      {course.track && (
                        <Badge variant="accent" className="mb-1 w-fit capitalize">
                          {course.track.replace(/-/g, " ")}
                        </Badge>
                      )}
                      <CardTitle className="text-h4">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                    </CardHeader>
                  </div>
                  <CardContent className="flex flex-col gap-3 pb-6">
                    <PriceTag price={Number(course.price)} />
                    <Button asChild variant="outline" size="sm" className="w-fit">
                      <Link href={`/courses/${course.slug}`}>
                        View track <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      {/* Testimonials */}
      {publishedCaseStudies.length > 0 && (
        <Section>
          <Container>
            <div className="mb-12 flex flex-col items-center gap-3 text-center">
              <h2 className="font-heading text-h2 font-bold">From the community</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {publishedCaseStudies.map((study) => (
                <Card key={study.id} className="overflow-hidden py-0">
                  <div className="relative h-44">
                    <Image src={study.image_url || "/images/ropes/proof-workbench.webp"} alt={study.image_url ? study.title : "An editorial view of hands-on AI automation work"} fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
                    {!study.image_url && <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-primary/75 px-3 py-1 text-micro font-medium text-white backdrop-blur-sm">Community story · visual illustration</span>}
                  </div>
                  <CardContent className="flex flex-col gap-3">
                    <Quote className="size-6 text-accent-600" />
                    <h3 className="font-heading text-lg font-semibold">{study.title}</h3>
                    <p className="text-sm text-muted-foreground">{study.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Closing CTA */}
      <Section className="relative overflow-hidden bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <div className="absolute inset-0 opacity-20"><Image src="/images/ropes/webinar-live.webp" alt="" fill sizes="100vw" className="object-cover" /></div>
        <div className="absolute inset-0 bg-primary/75" />
        <Container className="relative flex flex-col items-center gap-6 py-10 text-center">
          <h2 className="max-w-xl text-balance font-heading text-h2 font-bold">
            Ready to see how it works?
          </h2>
          <p className="max-w-md text-white/75">
            Join the free live webinar and see the tools, the tracks, and the path to going
            independent.
          </p>
          <Button asChild size="lg" variant="accent">
            <Link href="/webinar">
              Start free webinar <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Container>
      </Section>
    </div>
  );
}
