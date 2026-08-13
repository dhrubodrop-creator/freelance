import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { ORGANIZATION_ID, safeJsonLd, SITE_URL, WEBSITE_ID } from "@/lib/seo";
import "./globals.css";

const heading = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ropes — Turn Professional Skills Into AI-Powered Work",
    template: "%s · Ropes",
  },
  description:
    "Ropes helps working professionals combine existing expertise with AI systems, practical projects, portfolio evidence, and client-ready delivery for freelance, consulting, and independent work.",
  keywords: [
    "AI course for freelancers",
    "AI course for solo entrepreneurs",
    "learn AI to freelance",
    "AI no-code training",
    "agentic AI course",
    "n8n automation course",
    "freelance AI agency training",
    "AI mentor",
    "become an AI freelancer",
    "AI skills for entrepreneurs",
  ],
  authors: [{ name: "Ropes" }],
  category: "education",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ropes — Turn Professional Skills Into AI-Powered Work",
    description:
      "Build practical AI systems, create portfolio evidence, and connect your existing professional expertise to client-ready work.",
    siteName: "Ropes",
    type: "website",
    url: SITE_URL,
    locale: "en_IN",
    images: [{ url: `${SITE_URL}/images/ropes/hero-independent.webp`, alt: "A professional building an AI workflow for practical client work" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ropes — Turn Professional Skills Into AI-Powered Work",
    description:
      "Combine professional expertise with AI systems, practical builds, portfolio evidence, and client-ready delivery.",
    images: [`${SITE_URL}/images/ropes/hero-independent.webp`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": ORGANIZATION_ID,
  name: "Ropes",
  description: "Ropes helps working professionals combine existing expertise with AI systems, practical builds, portfolio evidence, and professional application.",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  areaServed: "IN",
  audience: {
    "@type": "Audience",
    audienceType: "Freelancers, solo entrepreneurs, working professionals",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Ropes",
  alternateName: ["Ropes AI", "Ropes.buzz"],
  url: SITE_URL,
  inLanguage: "en-IN",
  publisher: { "@id": ORGANIZATION_ID },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={heading.variable}>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
