import { ClerkProvider, SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/shared/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { getCurrentUser } from "@/lib/current-user";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create an account", alternates: { canonical: null }, robots: { index: false, follow: false, nocache: true } };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.profile_completed ? "/dashboard" : "/onboarding");

  return (
    <ClerkProvider>
      <AuthShell
        eyebrow="Get started"
        title="Create your Ropes account"
        subtitle="Two minutes of setup, then an AI-matched path built around your background and available hours."
      >
        <SignUp appearance={clerkAppearance} fallbackRedirectUrl="/onboarding" />
      </AuthShell>
    </ClerkProvider>
  );
}
