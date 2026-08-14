import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { IdeaPlanBuilder } from "@/components/profile/idea-plan-builder";
import type { CourseRow } from "@/types/db";

export default async function BuildFromIdeaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, slug, title, price, description, track, created_at)")
    .eq("user_id", user.id)
    .eq("status", "active");
  const courses = ((enrollmentRows ?? []) as unknown as { courses: CourseRow | null }[])
    .map((r) => r.courses)
    .filter((c): c is CourseRow => Boolean(c));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Build from my idea</h1>
        <p className="mt-1 text-muted-foreground">
          Describe a real idea. You&rsquo;ll get a PRD, user stories, architecture, and a real README/env-template
          you can use — nothing is created for you automatically, and nothing becomes a real project until you
          approve it.
        </p>
      </div>
      <IdeaPlanBuilder courses={courses} />
    </div>
  );
}
