import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  alternates: { canonical: null },
  robots: { index: false, follow: false, nocache: true },
};

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.profile_completed) redirect("/dashboard");

  return children;
}
