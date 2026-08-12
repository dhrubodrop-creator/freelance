import { redirect } from "next/navigation";
import { Briefcase, GraduationCap, Plus } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityFormDialog } from "@/components/admin/entity-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import { ExperienceFormDialog } from "@/components/profile/experience-form-dialog";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { CvUpload } from "@/components/profile/cv-upload";
import type { ProfileRow, WorkExperienceRow, EducationRow } from "@/types/db";

const EDUCATION_FIELDS = [
  { name: "institution", label: "Institution", type: "text" as const, required: true },
  { name: "degree", label: "Degree", type: "text" as const },
  { name: "field", label: "Field of study", type: "text" as const },
  { name: "start_date", label: "Start date (YYYY-MM-DD)", type: "text" as const },
  { name: "end_date", label: "End date (YYYY-MM-DD)", type: "text" as const },
];

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: profileData }, { data: experienceData }, { data: educationData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("work_experiences").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    supabase.from("education").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
  ]);

  const profile = profileData as ProfileRow | null;
  const experiences = (experienceData ?? []) as WorkExperienceRow[];
  const education = (educationData ?? []) as EducationRow[];

  const completion = computeProfileCompletion(profile, education.length > 0, experiences.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          {user.name ?? "—"} · {user.email ?? "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Profile completion</CardTitle>
            <span className="font-heading text-lg font-bold text-accent-600">{completion.percent}%</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={completion.percent} />
          {completion.missing.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {completion.missing.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your profile is fully filled out.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ProfileEditForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CV</CardTitle>
          <CardDescription>Uploaded once during onboarding — replace it here any time.</CardDescription>
        </CardHeader>
        <CardContent>
          <CvUpload hasCv={Boolean(profile?.cv_file_url)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Experience</CardTitle>
            </div>
            <ExperienceFormDialog
              title="Add experience"
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="size-4" /> Add
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {experiences.length === 0 && <p className="text-sm text-muted-foreground">No experience added yet.</p>}
          {experiences.map((exp) => (
            <div key={exp.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">
                  {exp.role} · {exp.company}
                </p>
                <p className="text-micro text-muted-foreground">
                  {exp.start_date ?? "—"} → {exp.end_date ?? "Present"}
                </p>
                {exp.description && <p className="text-sm text-muted-foreground">{exp.description}</p>}
                {exp.skills_used.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {exp.skills_used.map((s) => (
                      <Badge key={s} variant="accent">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ExperienceFormDialog
                  title="Edit experience"
                  initial={exp}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
                <DeleteButton endpoint={`/api/profile/experience/${exp.id}`} confirmMessage="Delete this experience?" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Education</CardTitle>
            </div>
            <EntityFormDialog
              title="Add education"
              fields={EDUCATION_FIELDS}
              endpoint="/api/profile/education"
              method="POST"
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="size-4" /> Add
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {education.length === 0 && <p className="text-sm text-muted-foreground">No education added yet.</p>}
          {education.map((ed) => (
            <div key={ed.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{ed.institution}</p>
                <p className="text-micro text-muted-foreground">
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </p>
                <p className="text-micro text-muted-foreground">
                  {ed.start_date ?? "—"} → {ed.end_date ?? "Present"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <EntityFormDialog
                  title="Edit education"
                  fields={EDUCATION_FIELDS}
                  initialValues={ed}
                  endpoint={`/api/profile/education/${ed.id}`}
                  method="PATCH"
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
                <DeleteButton endpoint={`/api/profile/education/${ed.id}`} confirmMessage="Delete this education record?" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
