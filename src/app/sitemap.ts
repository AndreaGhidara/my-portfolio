
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://a-ghidara-dev.vercel.app";
  return [
    { url: `${base}/it`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
  ];
}
