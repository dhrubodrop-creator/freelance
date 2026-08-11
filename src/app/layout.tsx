import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const heading = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ropes — AI Courses for Freelancers & Solo Entrepreneurs | Learn the Ropes, Go Independent",
    template: "%s · Ropes — AI Courses for Freelancers",
  },
  description:
    "Ropes teaches working professionals how to build AI no-code systems — agentic AI, LangChain, n8n automation, MLOps, and more — and turn that skill into freelance or solo-entrepreneur income. AI-matched path, AI mentor, real client-ready projects.",
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
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Ropes — AI Courses for Freelancers & Solo Entrepreneurs",
    description:
      "A guided, AI-mentored path from working professional to independent AI freelancer — agentic AI, automation, and client-ready projects.",
    siteName: "Ropes",
    type: "website",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ropes — AI Courses for Freelancers & Solo Entrepreneurs",
    description:
      "Learn AI no-code systems and go independent — agentic AI, automation, and an AI mentor guiding every step.",
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
  name: "Ropes",
  description:
    "Ropes teaches working professionals to build AI no-code systems and go independent as freelancers and solo entrepreneurs.",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  sameAs: [],
  areaServed: "IN",
  audience: {
    "@type": "Audience",
    audienceType: "Freelancers, solo entrepreneurs, working professionals",
  },
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
    <ClerkProvider>
      <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable}`}>
        <head>
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
        </head>
        <body className="min-h-screen bg-background font-sans text-foreground">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
