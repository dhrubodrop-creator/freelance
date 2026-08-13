import type { MetadataRoute } from "next";

import { supabaseAdmin } from "@/lib/supabase/server";
import { ACQUISITION_SLUGS, SKILL_SLUGS } from "@/lib/acquisition-content";
import { CONTENT_UPDATED_AT, SITE_URL } from "@/lib/seo";

const contentLastModified = new Date(`${CONTENT_UPDATED_AT}T00:00:00+05:30`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseAdmin();
  const { data: courses } = await supabase.from("courses").select("slug");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: contentLastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/courses`, lastModified: contentLastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/resources`, lastModified: contentLastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/for-professionals`, lastModified: contentLastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/resources/projects`, lastModified: contentLastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/about`, lastModified: contentLastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/webinar`, lastModified: contentLastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/case-studies`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/refund`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const acquisitionRoutes: MetadataRoute.Sitemap = ACQUISITION_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: contentLastModified,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const skillRoutes: MetadataRoute.Sitemap = SKILL_SLUGS.map((slug) => ({
    url: `${SITE_URL}/resources/skills/${slug}`,
    lastModified: contentLastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const courseRoutes: MetadataRoute.Sitemap = (courses ?? []).map((c) => ({
    url: `${SITE_URL}/courses/${c.slug}`,
    lastModified: contentLastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...acquisitionRoutes, ...skillRoutes, ...courseRoutes];
}
