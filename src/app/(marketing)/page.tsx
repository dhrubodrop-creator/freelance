import Link from "next/link";
import { ArrowRight, Compass, Layers, Quote, Sparkles, Users } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <Container className="relative flex flex-col items-center gap-8 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-micro font-semibold uppercase tracking-wide text-white/80">
            <Sparkles className="size-3.5 text-accent" />
            AI no-code training for working professionals
          </span>

          <h1 className="max-w-3xl text-balance font-heading text-display font-bold leading-[1.05]">
            Learn the ropes.
            <br />
            Go independent.
          </h1>

          <p className="max-w-xl text-balance text-body-lg text-white/75">
            Ropes teaches working professionals how to build AI no-code systems — and how to turn that
            skill into independent client work.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
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

          <div className="grid grid-cols-2 gap-4">
            <Card className="justify-center gap-2 p-2 text-center">
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <Layers className="size-6 text-accent-600" />
                <p className="font-heading text-base font-semibold">Structured tracks</p>
                <p className="text-sm text-muted-foreground">Pick a path suited to your background and goal.</p>
              </CardContent>
            </Card>
            <Card className="justify-center gap-2 p-2 text-center">
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <Sparkles className="size-6 text-accent-600" />
                <p className="font-heading text-base font-semibold">AI-mentored</p>
                <p className="text-sm text-muted-foreground">Get unstuck with an AI mentor trained on the course content.</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 justify-center gap-2 p-2 text-center">
              <CardContent className="flex flex-col items-center gap-2 py-4">
                <Users className="size-6 text-accent-600" />
                <p className="font-heading text-base font-semibold">Built for going independent</p>
                <p className="text-sm text-muted-foreground">
                  Templates and playbooks drawn from real client-facing work, not just theory.
                </p>
              </CardContent>
            </Card>
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
            <p className="text-center text-muted-foreground">Course catalog is unavailable right now — check back shortly.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="flex flex-col justify-between transition-shadow hover:shadow-lifted">
                  <div>
                    <CardHeader>
                      {course.track && (
                        <Badge variant="accent" className="mb-1 w-fit capitalize">
                          {course.track.replace(/-/g, " ")}
                        </Badge>
                      )}
                      <CardTitle className="text-h4">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                    </CardHeader>
                  </div>
                  <CardContent className="flex items-center justify-between">
                    <span className="font-heading text-lg font-semibold">
                      ₹{Number(course.price).toLocaleString("en-IN")}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/courses/${course.slug}`}>
                        View track <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Testimonials */}
      {caseStudies.length > 0 && (
        <Section>
          <Container>
            <div className="mb-12 flex flex-col items-center gap-3 text-center">
              <h2 className="font-heading text-h2 font-bold">From the community</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {caseStudies.map((study) => (
                <Card key={study.id} className="gap-3">
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
      <Section className="bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <Container className="flex flex-col items-center gap-6 py-6 text-center">
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
