import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import {
  getActiveEnrollment,
  getCourseBySlug,
  getCourseModules,
  getUserProgress,
  isModuleUnlocked,
} from "@/lib/course-access";

export default async function LearnIndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const enrolled = await getActiveEnrollment(user.id, course.id);
  if (!enrolled) redirect(`/checkout/${slug}`);

  const modules = await getCourseModules(course.id);
  if (modules.length === 0) redirect("/dashboard");

  const progress = await getUserProgress(user.id, modules.map((m) => m.id));

  const firstIncomplete = modules.find((m, i) => isModuleUnlocked(modules, i, progress) && !progress.get(m.id)?.completed_at);
  const target = firstIncomplete ?? modules[modules.length - 1];

  redirect(`/courses/${slug}/learn/${target.id}`);
}
