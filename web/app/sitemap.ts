import type { MetadataRoute } from "next";

const base = "https://wapy.51.210.108.173.sslip.io";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
