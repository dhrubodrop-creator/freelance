import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <PortalShell isAdmin title="Admin">
      {children}
    </PortalShell>
  );
}
