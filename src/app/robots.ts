import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard",
          "/onboarding",
          "/checkout/",
          "/sign-in/",
          "/sign-up/",
          "/community",
          "/sessions",
          "/profile",
          "/skills",
          "/portfolio",
          "/market-pulse",
          "/opportunities",
          "/courses/*/learn",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
