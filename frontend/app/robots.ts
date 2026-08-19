import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/seo";

/**
 * robots.txt. Закрываем от обхода то, что не должно попадать в поиск:
 * админку, личные разделы и внутренний прокси к API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/profile",
          "/favorites",
          "/users/",
        ],
      },
    ],
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
