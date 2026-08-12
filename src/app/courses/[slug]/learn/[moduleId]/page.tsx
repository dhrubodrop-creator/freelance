import { notFound, redirect } from "next/navigation";
import { FileText, FolderDown, CheckCircle2, Hammer, Target, ExternalLink } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import {
  getActiveEnrollment,
  getCourseBySlug,
  getCourseModules,
  getUserProgress,
  isModuleUnlocked,
} from "@/lib/course-access";
import { supabaseAdmin } from "@/lib/supabase/server";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import { ModuleSidebar } from "@/components/course/module-sidebar";
import { MarkCompleteButton } from "@/components/course/mark-complete-button";
import { MentorChatWidget } from "@/components/portal/mentor-chat-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlaybookRow, TemplateRow } from "@/types/db";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string; moduleId: string }>;
}) {
  const { slug, moduleId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const enrolled = await getActiveEnrollment(user.id, course.id);
  if (!enrolled) redirect(`/checkout/${slug}`);

  const modules = await getCourseModules(course.id);
  const activeIndex = modules.findIndex((m) => m.id === moduleId);
  if (activeIndex === -1) notFound();

  const progress = await getUserProgress(user.id, modules.map((m) => m.id));
  const unlocked = isModuleUnlocked(modules, activeIndex, progress);
  if (!unlocked) redirect(`/courses/${slug}/learn`);

  const activeModule = modules[activeIndex];
  const nextModule = modules[activeIndex + 1] ?? null;
  const isCompleted = Boolean(progress.get(activeModule.id)?.completed_at);
  const embedUrl = toYouTubeEmbedUrl(activeModule.video_url);

  const supabase = supabaseAdmin();
  const [{ data: templateData }, { data: playbookData }] = await Promise.all([
    supabase.from("templates").select("*").eq("module_id", activeModule.id),
    supabase.from("playbooks").select("*").eq("course_id", course.id),
  ]);
  const templates = (templateData ?? []) as TemplateRow[];
  const playbooks = (playbookData ?? []) as PlaybookRow[];

  const unlockedIds = new Set(modules.filter((_, i) => isModuleUnlocked(modules, i, progress)).map((m) => m.id));
  const completedIds = new Set(
    Array.from(progress.values()).filter((p) => p.completed_at).map((p) => p.module_id)
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 px-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
          {course.title}
        </p>
        <ModuleSidebar
          courseSlug={slug}
          modules={modules}
          unlockedIds={unlockedIds}
          completedIds={completedIds}
        />
      </aside>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Module {activeIndex + 1} of {modules.length}
          </p>
          <h1 className="font-heading text-h3 font-semibold">{activeModule.title}</h1>
        </div>

        {embedUrl && (
          <div className="flex flex-col gap-2">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink-950 shadow-card">
              <iframe
                src={embedUrl}
                title={activeModule.title}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {activeModule.video_source_label && (
              <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
                <ExternalLink className="size-3 shrink-0" />
                Curated video: {activeModule.video_source_label} — external, freely available. The
                breakdown below is written by Ropes.
              </p>
            )}
          </div>
        )}

        {activeModule.topics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What this module covers</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activeModule.topics.map((topic) => (
                <div key={topic} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{topic}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(activeModule.build_deliverable || activeModule.outcome) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeModule.build_deliverable && (
              <Card className="border-accent/30 bg-accent-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Hammer className="size-4 text-accent-600" />
                    Build / deliverable
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {activeModule.build_deliverable}
                </CardContent>
              </Card>
            )}
            {activeModule.outcome && (
              <Card className="border-primary-100 bg-primary-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="size-4 text-primary-700" />
                    Outcome
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{activeModule.outcome}</CardContent>
              </Card>
            )}
          </div>
        )}

        <div>
          <MarkCompleteButton
            moduleId={activeModule.id}
            nextHref={nextModule ? `/courses/${slug}/learn/${nextModule.id}` : null}
            completed={isCompleted}
          />
        </div>

        {(templates.length > 0 || playbooks.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resources for this module</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {templates.map((t) => (
                <a
                  key={t.id}
                  href={`/api/downloads/template/${t.id}`}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  <FolderDown className="size-4 text-accent-600" />
                  {t.title}
                  <span className="ml-auto text-micro text-muted-foreground">n8n template</span>
                </a>
              ))}
              {playbooks.map((p) => (
                <a
                  key={p.id}
                  href={`/api/downloads/playbook/${p.id}`}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  <FileText className="size-4 text-accent-600" />
                  {p.title}
                  <span className="ml-auto text-micro text-muted-foreground">PDF playbook</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <MentorChatWidget courseId={course.id} />
    </div>
  );
}
