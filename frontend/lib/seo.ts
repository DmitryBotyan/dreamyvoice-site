import type { Metadata } from "next";

/**
 * Получает базовый URL сайта из переменных окружения или использует localhost
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    // Клиентская сторона
    return window.location.origin;
  }
  // Серверная сторона
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
}

/**
 * Создает полный URL для страницы
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Генерирует базовые метаданные для сайта
 */
export function createBaseMetadata(overrides?: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const siteUrl = getSiteUrl();
  const title = overrides?.title || "DreamyVoice — Каталог аниме в озвучке команды";
  const description =
    overrides?.description ||
    "Смотрите аниме в профессиональной озвучке команды DreamyVoice. Каталог тайтлов с сериями, комментариями и удобным просмотром.";
  const image = overrides?.image || getAbsoluteUrl("/team-photo.png");
  const url = overrides?.url || siteUrl;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: "%s | DreamyVoice",
    },
    description,
    keywords: [
      "аниме",
      "озвучка",
      "DreamyVoice",
      "аниме каталог",
      "смотреть аниме",
      "русская озвучка",
      "аниме серии",
    ],
    authors: [{ name: "DreamyVoice Team" }],
    creator: "DreamyVoice",
    publisher: "DreamyVoice",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: "DreamyVoice",
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@dreamyvoice",
    },
    robots: overrides?.robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Генерирует метаданные для страницы тайтла
 */
export function createTitleMetadata(
  title: {
    name: string;
    description?: string | null;
    coverKey?: string | null;
    slug: string;
    episodes: Array<{ number: number; published: boolean }>;
  }
): Metadata {
  const siteUrl = getSiteUrl();
  const titleName = title.name;
  const description =
    title.description?.trim() ||
    `Смотрите ${titleName} в озвучке команды DreamyVoice. Все серии доступны для просмотра онлайн.`;
  const url = getAbsoluteUrl(`/titles/${title.slug}`);
  const publishedEpisodes = title.episodes.filter((ep) => ep.published);
  const episodeCount = publishedEpisodes.length;
  const totalEpisodes = title.episodes.length;

  // Формируем описание с информацией о сериях
  const episodeInfo =
    episodeCount > 0
      ? `${episodeCount} ${episodeCount === 1 ? "серия" : episodeCount < 5 ? "серии" : "серий"}`
      : "Скоро";
  const fullDescription = `${description} ${episodeInfo} доступно для просмотра.`;

  // Изображение обложки или дефолтное
  const image = title.coverKey
    ? getAbsoluteUrl(`/media/covers/${encodeURIComponent(title.coverKey)}`)
    : getAbsoluteUrl("/team-photo.png");

  return {
    title: titleName,
    description: fullDescription,
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: "DreamyVoice",
      title: `${titleName} | DreamyVoice`,
      description: fullDescription,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `Обложка ${titleName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleName} | DreamyVoice`,
      description: fullDescription,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Создает JSON-LD структурированные данные для тайтла
 */
export function createTitleJsonLd(
  title: {
    name: string;
    description?: string | null;
    coverKey?: string | null;
    slug: string;
    episodes: Array<{ number: number; published: boolean; name?: string | null }>;
    genres?: string[] | null;
    tags?: string[] | null;
  }
): object {
  const siteUrl = getSiteUrl();
  const url = getAbsoluteUrl(`/titles/${title.slug}`);
  const publishedEpisodes = title.episodes.filter((ep) => ep.published);
  const image = title.coverKey
    ? getAbsoluteUrl(`/media/covers/${encodeURIComponent(title.coverKey)}`)
    : getAbsoluteUrl("/team-photo.png");

  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: title.name,
    description: title.description?.trim() || undefined,
    image: image,
    url: url,
    publisher: {
      "@type": "Organization",
      name: "DreamyVoice",
      url: siteUrl,
    },
    numberOfEpisodes: publishedEpisodes.length,
    ...(title.genres && title.genres.length > 0
      ? {
          genre: title.genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)),
        }
      : {}),
    ...(publishedEpisodes.length > 0
      ? {
          episode: publishedEpisodes.map((ep, idx) => ({
            "@type": "TVEpisode",
            episodeNumber: ep.number,
            name: ep.name || `Серия ${ep.number}`,
            url: `${url}#episode-${ep.number}`,
          })),
        }
      : {}),
  };
}

/**
 * Создает JSON-LD структурированные данные для организации (сайта)
 */
export function createOrganizationJsonLd(): object {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DreamyVoice",
    url: siteUrl,
    logo: getAbsoluteUrl("/team-photo.png"),
    description:
      "Команда озвучки аниме DreamyVoice. Профессиональная озвучка и каталог тайтлов.",
    sameAs: [],
  };
}

/**
 * Создает JSON-LD структурированные данные для веб-сайта
 */
export function createWebsiteJsonLd(): object {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DreamyVoice",
    url: siteUrl,
    description:
      "Каталог аниме в озвучке команды DreamyVoice. Смотрите тайтлы онлайн с удобным плеером.",
    publisher: {
      "@type": "Organization",
      name: "DreamyVoice",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

