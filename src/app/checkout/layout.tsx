import { Toaster } from "@/components/ui/sonner";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
