import { ClerkProvider } from "@clerk/nextjs";

import { Toaster } from "@/components/ui/sonner";

export function AuthenticatedRuntime({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
      <Toaster />
    </ClerkProvider>
  );
}
