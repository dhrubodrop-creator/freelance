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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Ropes — Learn the ropes. Go independent.",
    template: "%s · Ropes",
  },
  description:
    "Ropes teaches working professionals how to build AI no-code systems and go independent — a guided path from first automation to a freelance income.",
  keywords: ["AI no-code", "freelance training", "automation agency", "n8n course", "AI mentor"],
  openGraph: {
    title: "Ropes — Learn the ropes. Go independent.",
    description:
      "A guided, AI-mentored path from working professional to independent no-code freelancer.",
    siteName: "Ropes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ropes — Learn the ropes. Go independent.",
  },
  icons: {
    icon: "/favicon.ico",
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
        <body className="min-h-screen bg-background font-sans text-foreground">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
