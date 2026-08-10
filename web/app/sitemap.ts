import type { MetadataRoute } from "next";
import { SITE_URL as base } from "@/lib/site";
import { POSTS } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...POSTS.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated || p.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
