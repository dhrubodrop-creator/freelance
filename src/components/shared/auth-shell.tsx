import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Logo } from "@/components/shared/logo";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-mesh-hero bg-noise opacity-90" />
        <div className="relative z-10">
          <Logo dark />
        </div>
        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-micro font-medium text-white/80">
            <Sparkles className="size-3.5" />
            AI-matched learning path
          </span>
          <p className="mt-5 font-heading text-h3 font-semibold text-white text-balance">
            Learn the ropes. Go independent.
          </p>
          <p className="mt-3 text-sm text-white/65">
            Ropes matches you to a track based on your background, then pairs every module with an AI mentor and a
            real 1:1 session.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="w-full max-w-sm lg:hidden">
          <Logo />
        </div>
        <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
          <span className="text-micro font-semibold uppercase tracking-wide text-accent-600">{eyebrow}</span>
          <h1 className="font-heading text-h3 font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Ropes
        </Link>
      </div>
    </div>
  );
}
