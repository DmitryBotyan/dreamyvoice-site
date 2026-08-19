import type { MetadataRoute } from "next";
import { getNewsPosts, getTitles } from "@/lib/server-api";
import { getAbsoluteUrl } from "@/lib/seo";

/** Карта сайта пересобирается раз в час: релизы выходят не чаще. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getAbsoluteUrl("/news"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/team"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: getAbsoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: getAbsoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Если API недоступен, карта не должна ронять сборку: отдаём хотя бы статику.
  const [titles, posts] = await Promise.all([
    getTitles().catch(() => []),
    getNewsPosts().catch(() => []),
  ]);

  const titlePages: MetadataRoute.Sitemap = titles.map((title) => ({
    url: getAbsoluteUrl(`/titles/${title.slug}`),
    lastModified: new Date(title.updatedAt),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const newsPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: getAbsoluteUrl(`/news/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...titlePages, ...newsPages];
}
