import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl.toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/login", siteUrl).toString(), changeFrequency: "monthly", priority: 0.3 },
    { url: new URL("/register", siteUrl).toString(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
