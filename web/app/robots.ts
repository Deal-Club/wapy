import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/onboarding"] },
    sitemap: "https://wapy.51.210.108.173.sslip.io/sitemap.xml",
  };
}
