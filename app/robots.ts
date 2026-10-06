import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: ["/api/", "/admin/", "/dashboard/", "/settings/", "/weddings/", "/vendor/", "/planner/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
