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
import { breadcrumbJsonLd, ORGANIZATION_ID, pageMetadata, safeJsonLd, SITE_URL } from "@/lib/seo";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";

export const revalidate = 3600;

export const metadata = pageMetadata({ title: "Practical AI Courses for Professional & Independent Work", description: "Compare Ropes courses by capability, curriculum, hands-on builds, portfolio evidence, and professional application—from no-code automation to agent engineering, data, testing, security, and AI operations.", path: "/courses" });

export default async function CoursesPage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("courses").select("*").order("price", { ascending: true });
  const courses = (data ?? []) as CourseRow[];
  const courseListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/courses/${course.slug}`,
      item: {
        "@type": "Course",
        name: course.title,
        description: course.description,
        provider: { "@type": "EducationalOrganization", "@id": ORGANIZATION_ID, name: "Ropes", url: SITE_URL },
      },
    })),
  };
  const breadcrumb = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }]);

  return (
    <Section className="bg-ink-50">
      <Container>
        {[courseListJsonLd, breadcrumb].map((item, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(item) }} />)}
        <MarketingBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Courses" }]} />
        <div className="mb-12 max-w-3xl">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent-600">Choose by outcome</span>
          <h1 className="mt-2 font-heading text-h1 font-bold">Course tracks</h1>
          <p className="mt-3 text-body-lg text-muted-foreground">
            {courses.length} focused paths. Every track has its own tools, production context, and practical outcome.
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
                  <CardContent className="flex flex-col gap-3 pb-6">
                    <PriceTag price={Number(course.price)} slug={course.slug} />
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
  );
}
