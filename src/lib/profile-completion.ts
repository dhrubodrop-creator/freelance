import type { ProfileRow } from "@/types/db";

export interface ProfileCompletionItem {
  label: string;
  done: boolean;
}

export interface ProfileCompletion {
  percent: number;
  items: ProfileCompletionItem[];
  missing: string[];
}

/**
 * Every percentage point here corresponds to a real, checkable field or
 * record — no synthetic "engagement score." Each item is worth an equal
 * share; `missing` lists exactly what's left, in the same order shown here.
 */
export function computeProfileCompletion(
  profile: Pick<
    ProfileRow,
    "bio" | "location" | "income_goal_inr" | "work_preference" | "linkedin_url" | "portfolio_url" | "github_url" | "website_url" | "cv_file_url"
  > | null,
  hasEducation: boolean,
  hasExperience: boolean
): ProfileCompletion {
  const hasLink = Boolean(
    profile?.linkedin_url || profile?.portfolio_url || profile?.github_url || profile?.website_url
  );

  const items: ProfileCompletionItem[] = [
    { label: "Add a short bio", done: Boolean(profile?.bio?.trim()) },
    { label: "Add your location", done: Boolean(profile?.location?.trim()) },
    { label: "Set an income goal", done: profile?.income_goal_inr != null },
    { label: "Set a work preference", done: Boolean(profile?.work_preference) },
    { label: "Add previous experience", done: hasExperience },
    { label: "Add your education", done: hasEducation },
    { label: "Add a portfolio, LinkedIn, GitHub, or website link", done: hasLink },
    { label: "Upload your CV", done: Boolean(profile?.cv_file_url) },
  ];

  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);

  return { percent, items, missing: items.filter((i) => !i.done).map((i) => i.label) };
}
