import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText, FolderDown, CheckCircle2, Hammer, Target, Sparkles, Compass } from "lucide-react";

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
import { ConceptRescueButton } from "@/components/course/concept-rescue-button";
import { ResumeStateTracker } from "@/components/course/resume-state-tracker";
import { MentorChatWidget } from "@/components/portal/mentor-chat-widget";
import { PlaybookTab } from "@/components/course/playbook-tab";
import { ExercisesTab } from "@/components/course/exercises-tab";
import { InterviewPrepTab } from "@/components/course/interview-prep-tab";
import { ProjectWorkspaceCard } from "@/components/course/project-workspace-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  CapstoneSubmissionRow,
  CourseDiagnosticRow,
  ExerciseRow,
  ModulePlaybookSectionRow,
  InterviewQuestionRow,
  PlaybookRow,
  SkillRow,
  TemplateRow,
} from "@/types/db";

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
  const [
    { data: templateData },
    { data: playbookData },
    { data: playbookSectionsData },
    { data: exercisesData },
    { data: interviewQuestionsData },
    { data: moduleSkillLinks },
    { data: diagnosticData },
    { count: portfolioItemCount },
    { data: capstoneData },
  ] = await Promise.all([
    supabase.from("templates").select("*").eq("module_id", activeModule.id),
    supabase.from("playbooks").select("*").eq("course_id", course.id),
    supabase.from("module_playbook_sections").select("*").eq("module_id", activeModule.id).order("order_index"),
    supabase.from("exercises").select("*").eq("module_id", activeModule.id).order("order_index"),
    supabase.from("interview_questions").select("*").eq("module_id", activeModule.id).order("order_index"),
    supabase.from("module_skills").select("skill_id, skills(*)").eq("module_id", activeModule.id),
    supabase.from("course_diagnostics").select("*").eq("user_id", user.id).eq("course_id", course.id).maybeSingle(),
    supabase.from("portfolio_items").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("course_id", course.id),
    supabase.from("course_capstones").select("id").eq("course_id", course.id).maybeSingle(),
  ]);
  const diagnostic = diagnosticData as CourseDiagnosticRow | null;
  const activeGuidance = diagnostic?.module_guidance?.[activeModule.id] ?? null;
  const hasPortfolioProject = (portfolioItemCount ?? 0) > 0;
  let capstoneStatus: CapstoneSubmissionRow["status"] | null = null;
  if (capstoneData) {
    const { data: submission } = await supabase
      .from("capstone_submissions")
      .select("status")
      .eq("user_id", user.id)
      .eq("capstone_id", capstoneData.id)
      .maybeSingle();
    capstoneStatus = submission?.status ?? null;
  }
  const exercisesForModule = (exercisesData ?? []) as ExerciseRow[];
  const { data: exerciseCompletionRows } =
    exercisesForModule.length > 0
      ? await supabase
          .from("exercise_completions")
          .select("exercise_id")
          .eq("user_id", user.id)
          .in("exercise_id", exercisesForModule.map((e) => e.id))
      : { data: [] };
  const completedExerciseIds = new Set((exerciseCompletionRows ?? []).map((r) => r.exercise_id as string));
  const templates = (templateData ?? []) as TemplateRow[];
  const playbooks = (playbookData ?? []) as PlaybookRow[];
  const playbookSections = (playbookSectionsData ?? []) as ModulePlaybookSectionRow[];
  const exercises = (exercisesData ?? []) as ExerciseRow[];
  const interviewQuestions = (interviewQuestionsData ?? []) as InterviewQuestionRow[];
  const skillsGained = ((moduleSkillLinks ?? []) as unknown as { skills: SkillRow | null }[])
    .map((l) => l.skills)
    .filter((s): s is SkillRow => Boolean(s));

  const hasDeepContent = playbookSections.length > 0 || exercises.length > 0 || interviewQuestions.length > 0;
  const completedProjectStages = modules
    .slice(0, activeIndex)
    .filter((module) => Boolean(progress.get(module.id)?.completed_at));

  const unlockedIds = new Set(modules.filter((_, i) => isModuleUnlocked(modules, i, progress)).map((m) => m.id));
  const completedIds = new Set(
    Array.from(progress.values()).filter((p) => p.completed_at).map((p) => p.module_id)
  );

  const overviewContent = (
    <div className="flex flex-col gap-6">
      {!diagnostic && (
        <Card className="border-accent/30 bg-accent-50/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-2.5 text-sm">
              <Compass className="size-4 shrink-0 text-accent-600" />
              <span>
                Take the 2-minute diagnostic to see which modules you can move through quickly and which
                deserve extra time.
              </span>
            </div>
            <Link
              href={`/courses/${slug}/learn/diagnostic`}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              Start diagnostic
            </Link>
          </CardContent>
        </Card>
      )}
      {diagnostic && activeIndex === 0 && (
        <Card className="border-border bg-muted/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>
              <span className="font-medium">Your starting point: </span>
              {diagnostic.starting_point}
            </span>
            <Link
              href={`/courses/${slug}/learn/diagnostic`}
              className="shrink-0 text-accent-600 hover:underline"
            >
              Retake
            </Link>
          </CardContent>
        </Card>
      )}
      {activeGuidance && activeGuidance.depth !== "full" && (
        <Card className="border-primary-100 bg-primary-50/40">
          <CardContent className="flex items-center gap-2.5 py-4 text-sm">
            <Compass className="size-4 shrink-0 text-primary-700" />
            <span>{activeGuidance.reason}</span>
          </CardContent>
        </Card>
      )}
      <ProjectWorkspaceCard
        activeModuleTitle={activeModule.title}
        activeModuleIndex={activeIndex}
        nextTaskLabel={activeModule.build_deliverable ?? "Complete this stage's exercises and mark it done."}
        completedStageTitles={completedProjectStages.map((module) => module.title)}
        hasPortfolioProject={hasPortfolioProject}
        capstoneExists={Boolean(capstoneData)}
        capstoneStatus={capstoneStatus}
      />
      {embedUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink-950 shadow-card">
          <iframe
            src={embedUrl}
            title={activeModule.title}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
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
              <CardContent className="text-sm text-muted-foreground">{activeModule.build_deliverable}</CardContent>
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

      {skillsGained.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-accent-600" />
              Skills this module builds
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skillsGained.map((skill) => (
              <Badge key={skill.id} variant="outline">
                {skill.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <MarkCompleteButton
          moduleId={activeModule.id}
          nextHref={nextModule ? `/courses/${slug}/learn/${nextModule.id}` : null}
          completed={isCompleted}
        />
        <ConceptRescueButton moduleId={activeModule.id} />
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
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <ResumeStateTracker courseId={course.id} moduleId={activeModule.id} activeTab="overview" />
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 px-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
          {course.title}
        </p>
        <ModuleSidebar
          courseSlug={slug}
          modules={modules}
          unlockedIds={unlockedIds}
          completedIds={completedIds}
          guidance={diagnostic?.module_guidance}
        />
      </aside>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Module {activeIndex + 1} of {modules.length}
          </p>
          <h1 className="font-heading text-h3 font-semibold">{activeModule.title}</h1>
        </div>

        {hasDeepContent ? (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {playbookSections.length > 0 && <TabsTrigger value="playbook">Playbook</TabsTrigger>}
              {exercises.length > 0 && <TabsTrigger value="practice">Practice</TabsTrigger>}
              {interviewQuestions.length > 0 && <TabsTrigger value="interview">Interview Prep</TabsTrigger>}
            </TabsList>
            <TabsContent value="overview">{overviewContent}</TabsContent>
            {playbookSections.length > 0 && (
              <TabsContent value="playbook">
                <PlaybookTab sections={playbookSections} />
              </TabsContent>
            )}
            {exercises.length > 0 && (
              <TabsContent value="practice">
                <ExercisesTab exercises={exercises} completedIds={completedExerciseIds} />
              </TabsContent>
            )}
            {interviewQuestions.length > 0 && (
              <TabsContent value="interview">
                <InterviewPrepTab questions={interviewQuestions} />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          overviewContent
        )}
      </div>

      <MentorChatWidget courseId={course.id} moduleId={activeModule.id} moduleTitle={activeModule.title} />
    </div>
  );
}
