import Link from "next/link";
import { Menu } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <Container className="relative flex h-18 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={link.href === "/webinar" ? false : undefined}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in" prefetch={false}>Sign in</Link>
          </Button>
          <Button asChild variant="accent" size="sm">
            <Link href="/webinar" prefetch={false}>Free Webinar</Link>
          </Button>
        </div>

        <details className="group lg:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </summary>
          <div className="absolute inset-x-6 top-[calc(100%+0.5rem)] rounded-xl border border-border bg-background p-4 shadow-lifted">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={link.href === "/webinar" ? false : undefined}
                  className="rounded-md px-2 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              <Button asChild variant="outline"><Link href="/sign-in" prefetch={false}>Sign in</Link></Button>
              <Button asChild variant="accent"><Link href="/webinar" prefetch={false}>Free Webinar</Link></Button>
            </div>
          </div>
        </details>
      </Container>
    </header>
  );
}
