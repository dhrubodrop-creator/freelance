import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { NAV_LINKS, LEGAL_LINKS, WHATSAPP_LINK, SITE_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground/90">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Logo dark />
            <p className="max-w-xs text-sm text-primary-foreground/70">{SITE_TAGLINE}</p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-primary-foreground/85 transition-colors hover:border-white/30 hover:text-white"
            >
              <MessageCircle className="size-4" />
              Chat on WhatsApp
            </a>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <span className="font-heading font-semibold text-primary-foreground">Explore</span>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary-foreground/70 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <span className="font-heading font-semibold text-primary-foreground">Account</span>
            <Link href="/dashboard" className="text-primary-foreground/70 hover:text-white">
              Dashboard
            </Link>
            <Link href="/community" className="text-primary-foreground/70 hover:text-white">
              Community
            </Link>
            <Link href="/contact" className="text-primary-foreground/70 hover:text-white">
              Support
            </Link>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <span className="font-heading font-semibold text-primary-foreground">Legal</span>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary-foreground/70 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-primary-foreground/55 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Ropes. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            Payments secured by Razorpay
          </span>
        </div>
      </Container>
    </footer>
  );
}
