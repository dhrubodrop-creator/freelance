export const SITE_NAME = "Ropes";
export const SITE_TAGLINE = "Learn the ropes. Go independent.";

export const NAV_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/webinar", label: "Free Webinar" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/refund", label: "Refund Policy" },
] as const;

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "910000000000";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const ENABLE_RETAINER_SUBSCRIPTIONS =
  process.env.NEXT_PUBLIC_ENABLE_RETAINER_SUBSCRIPTIONS === "true";
