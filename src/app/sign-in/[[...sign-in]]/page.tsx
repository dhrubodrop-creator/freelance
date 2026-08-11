import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/shared/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Ropes"
      subtitle="Pick up your course, your AI mentor, and your next module right where you left off."
    >
      <SignIn appearance={clerkAppearance} fallbackRedirectUrl="/dashboard" />
    </AuthShell>
  );
}
