import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: null }, robots: { index: false, follow: false, nocache: true } };
import { PortalShell } from "@/components/portal/portal-shell";
import { AuthenticatedRuntime } from "@/components/shared/authenticated-runtime";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.profile_completed) redirect("/onboarding");

  return (
    <AuthenticatedRuntime>
      <PortalShell isAdmin={user.role === "admin"}>{children}</PortalShell>
    </AuthenticatedRuntime>
  );
}
