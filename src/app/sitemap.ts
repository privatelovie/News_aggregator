import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  return [
    "",
    "/feed",
    "/search",
    ...CATEGORIES.map((category) => `/categories/${category.slug}`)
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "hourly",
    priority: path === "" ? 1 : 0.7
  }));
}
