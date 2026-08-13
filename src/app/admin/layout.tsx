import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { PortalShell } from "@/components/portal/portal-shell";
import { AdminNav } from "@/components/admin/admin-nav";
import { AuthenticatedRuntime } from "@/components/shared/authenticated-runtime";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: null }, robots: { index: false, follow: false, nocache: true } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <AuthenticatedRuntime>
      <PortalShell isAdmin title="Admin">
        <div className="flex flex-col gap-6">
          <AdminNav />
          {children}
        </div>
      </PortalShell>
    </AuthenticatedRuntime>
  );
}
