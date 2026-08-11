import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.profile_completed) redirect("/onboarding");

  return <PortalShell isAdmin={user.role === "admin"}>{children}</PortalShell>;
}
