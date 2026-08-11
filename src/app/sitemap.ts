import type { MetadataRoute } from "next";

import { supabaseAdmin } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseAdmin();
  const { data: courses } = await supabase.from("courses").select("slug");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/webinar`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/case-studies`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/refund`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const courseRoutes: MetadataRoute.Sitemap = (courses ?? []).map((c) => ({
    url: `${SITE_URL}/courses/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...courseRoutes];
}
