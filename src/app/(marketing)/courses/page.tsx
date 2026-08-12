import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCourseVisual } from "@/components/marketing/course-visual";
import { Container, Section } from "@/components/shared/container";
import { PriceTag } from "@/components/shared/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow } from "@/types/db";

export const revalidate = 3600;

export const metadata = {
  title: "AI Courses for Freelancers & Solo Entrepreneurs",
  description:
    "Browse Ropes' AI course tracks — agentic AI, LangChain, n8n automation, MLOps, cloud AI, and more — guided paths from working professional to independent AI freelancer or solo entrepreneur.",
};

export default async function CoursesPage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("courses").select("*").order("price", { ascending: true });
  const courses = (data ?? []) as CourseRow[];

  return (
    <Section className="bg-ink-50">
      <Container>
        <div className="mb-12 max-w-3xl">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent-600">Choose by outcome</span>
          <h1 className="mt-2 font-heading text-h1 font-bold">Course tracks</h1>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Nineteen focused paths. Every track has its own tools, production context, and practical outcome.
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="mx-auto max-w-xl border-dashed text-center">
            <CardContent className="py-10">
              <p className="font-heading font-semibold">Enrollment is between cohorts.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Join the free webinar for the next track announcement.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {courses.map((course) => {
              const visual = getCourseVisual(course.slug);
              return (
                <Card
                  key={course.id}
                  className="group flex w-full flex-col overflow-hidden py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-primary">
                    <Image
                      src={visual.src}
                      alt={visual.alt}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/65 via-transparent to-transparent" />
                  </div>
                  <CardHeader className="flex-1 pb-4 pt-5">
                    {course.track && (
                      <Badge variant="accent" className="mb-1 w-fit">
                        {course.track}
                      </Badge>
                    )}
                    <CardTitle className="text-h4">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-end justify-between gap-4 pb-6">
                    <PriceTag price={Number(course.price)} />
                    <Button asChild variant="outline" size="sm" className="shrink-0">
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
  );
}
