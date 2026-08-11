import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, GraduationCap, Radio } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegenerateRecommendationButton } from "@/components/portal/regenerate-recommendation-button";
import type { CourseRow, EnrollmentRow, RecommendationRow } from "@/types/db";

type RecommendationWithCourse = RecommendationRow & { course: CourseRow | null };
type EnrollmentWithCourse = EnrollmentRow & { course: CourseRow | null };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();

  const [{ data: recommendation }, { data: enrollments }, { data: courses }] = await Promise.all([
    supabase
      .from("recommendations")
      .select("*, course:courses(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: RecommendationWithCourse | null }>,
    supabase
      .from("enrollments")
      .select("*, course:courses(*)")
      .eq("user_id", user.id)
      .eq("status", "active") as unknown as Promise<{ data: EnrollmentWithCourse[] | null }>,
    supabase.from("courses").select("*").order("price", { ascending: true }),
  ]);

  const recommendedCourse = recommendation?.course ?? null;
  const enrolledCourseIds = new Set((enrollments ?? []).map((e) => e.course_id));

  const { data: latestAnnouncement } = enrolledCourseIds.size
    ? await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
        <h1 className="font-heading text-h2 font-bold">Your dashboard</h1>
      </div>

      {recommendedCourse && !enrolledCourseIds.has(recommendedCourse.id) && (
        <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="accent" className="gap-1">
                <Sparkles className="size-3" />
                AI recommended
              </Badge>
              <RegenerateRecommendationButton />
            </div>
            <CardTitle className="text-h4">{recommendedCourse.title}</CardTitle>
            <CardDescription>{recommendation?.rationale}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="accent">
              <Link href={`/courses/${recommendedCourse.slug}`}>
                View this track <ArrowRight className="size-4" />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">₹{Number(recommendedCourse.price).toLocaleString("en-IN")}</span>
          </CardContent>
        </Card>
      )}

      {latestAnnouncement && (
        <Card className="border-primary-100 bg-primary-50/40">
          <CardContent className="flex items-start gap-3 py-5">
            <Radio className="mt-0.5 size-4 shrink-0 text-primary-700" />
            <div>
              <p className="font-heading text-sm font-semibold text-primary-700">{latestAnnouncement.title}</p>
              <p className="text-sm text-muted-foreground">{latestAnnouncement.body}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {enrollments && enrollments.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold">Continue learning</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;
              return (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="sm">
                      <Link href={`/courses/${course.slug}/learn`}>
                        Resume <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
          <GraduationCap className="size-5 text-muted-foreground" />
          Browse all tracks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="text-base">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm font-medium">₹{Number(course.price).toLocaleString("en-IN")}</span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/courses/${course.slug}`}>Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
