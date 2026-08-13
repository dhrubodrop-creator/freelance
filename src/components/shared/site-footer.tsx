import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/shared/container";
import { LEGAL_LINKS, WHATSAPP_LINK, SITE_TAGLINE } from "@/lib/constants";

const DISCOVER_LINKS = [
  { href: "/ai-freelancing", label: "AI freelancing" },
  { href: "/side-hustle-for-working-professionals", label: "Professional side hustle" },
  { href: "/solopreneur-with-ai", label: "Solopreneur with AI" },
  { href: "/for-professionals", label: "AI for professionals" },
];

const LEARN_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resource hub" },
  { href: "/resources/projects", label: "Project briefs" },
  { href: "/webinar", label: "Free webinar" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground/90">
      <Container className="py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_0.8fr]">
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
            <span className="font-heading font-semibold text-primary-foreground">Discover</span>
            {DISCOVER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary-foreground/70 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <span className="font-heading font-semibold text-primary-foreground">Learn &amp; build</span>
            {LEARN_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary-foreground/70 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <span className="font-heading font-semibold text-primary-foreground">Legal</span>
            <Link href="/about" className="text-primary-foreground/70 hover:text-white">About Ropes</Link>
            <Link href="/contact" className="text-primary-foreground/70 hover:text-white">Contact</Link>
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
