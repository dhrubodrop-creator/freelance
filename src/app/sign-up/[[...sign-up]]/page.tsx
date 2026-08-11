import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/shared/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your Ropes account"
      subtitle="Two minutes of setup, then an AI-matched path built around your background and available hours."
    >
      <SignUp appearance={clerkAppearance} fallbackRedirectUrl="/onboarding" />
    </AuthShell>
  );
}
