import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/shared/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { clerkLocalization } from "@/lib/clerk-localization";
import { getCurrentUser } from "@/lib/current-user";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in", alternates: { canonical: null }, robots: { index: false, follow: false, nocache: true } };

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.profile_completed ? "/dashboard" : "/onboarding");

  return (
    <ClerkProvider localization={clerkLocalization}>
      <AuthShell
        eyebrow="Welcome back"
        title="Sign in to Ropes"
        subtitle="Pick up your course, your AI mentor, and your next module right where you left off."
      >
        <SignIn appearance={clerkAppearance} fallbackRedirectUrl="/dashboard" />
      </AuthShell>
    </ClerkProvider>
  );
}
