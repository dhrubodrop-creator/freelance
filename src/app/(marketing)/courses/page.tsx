import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow } from "@/types/db";

export const revalidate = 3600;

export const metadata = {
  title: "Courses",
  description: "Browse the Ropes course tracks — guided paths from working professional to independent AI no-code freelancer.",
};

export default async function CoursesPage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("courses").select("*").order("price", { ascending: true });
  const courses = (data ?? []) as CourseRow[];

  return (
    <Section>
      <Container>
        <div className="mb-12 max-w-2xl">
          <h1 className="font-heading text-h1 font-bold">Course tracks</h1>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Each track is a guided path — pick the one that matches where you&rsquo;re starting from.
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="text-muted-foreground">Course catalog is unavailable right now — check back shortly.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col justify-between">
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
  );
}
