import type { Metadata } from "next";

type OpenGraphImages = NonNullable<Metadata["openGraph"]>["images"];

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
 * Обрезает описание до оптимальной длины для социальных сетей
 * @param description - исходное описание
 * @param maxLength - максимальная длина (по умолчанию 300 для OG, 200 для Twitter)
 * @returns обрезанное описание с многоточием, если было обрезано
 */
export function truncateDescription(
  description: string,
  maxLength: number = 300
): string {
  if (description.length <= maxLength) {
    return description;
  }
  // Обрезаем до последнего пробела перед лимитом, чтобы не обрывать слова
  const truncated = description.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.8) {
    // Если пробел найден не слишком близко к началу, обрезаем по нему
    return truncated.substring(0, lastSpace) + "...";
  }
  return truncated + "...";
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
  imageWidth?: number;
  imageHeight?: number;
}): Metadata {
  const siteUrl = getSiteUrl();
  const title = overrides?.title || "DreamyVoice — Каталог аниме в озвучке команды";
  const fullDescription =
    overrides?.description ||
    "Смотрите аниме в профессиональной озвучке команды DreamyVoice. Каталог тайтлов с сериями, комментариями и удобным просмотром. Все релизы доступны онлайн бесплатно.";
  
  // Оптимизируем описания для разных платформ
  const ogDescription = truncateDescription(fullDescription, 300); // OG поддерживает до 300 символов
  const twitterDescription = truncateDescription(fullDescription, 200); // Twitter рекомендует до 200 символов
  
  const image = overrides?.image || getAbsoluteUrl("/og-image.png");
  const url = overrides?.url || siteUrl;
  const imageWidth = overrides?.imageWidth ?? 1200;
  const imageHeight = overrides?.imageHeight ?? 630;

  // Создаем абсолютный URL для изображения с поддержкой HTTPS
  const imageUrl = image.startsWith("http") ? image : getAbsoluteUrl(image);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: "%s | DreamyVoice",
    },
    description: fullDescription, // Полное описание для поисковых систем
    keywords: [
      "аниме",
      "озвучка",
      "DreamyVoice",
      "аниме каталог",
      "смотреть аниме",
      "русская озвучка",
      "аниме серии",
      "аниме онлайн",
      "бесплатное аниме",
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
      description: ogDescription, // Оптимизированное описание для OG
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: twitterDescription, // Оптимизированное описание для Twitter
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
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
    // Дополнительные мета-теги для VK, Telegram и других платформ
    other: {
      "vk:title": title,
      "vk:description": ogDescription,
      "vk:image": imageUrl,
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

  // Формируем подробное описание с информацией о сериях
  let episodeInfo = "";
  if (episodeCount > 0) {
    const episodeWord =
      episodeCount === 1
        ? "серия"
        : episodeCount < 5
        ? "серии"
        : "серий";
    episodeInfo = `${episodeCount} ${episodeWord} доступно для просмотра онлайн.`;
  } else {
    episodeInfo = "Скоро будут доступны серии для просмотра.";
  }

  // Создаем подробное описание
  const baseDescription = description.trim() || `Смотрите ${titleName} в профессиональной озвучке команды DreamyVoice.`;
  const fullDescription = `${baseDescription} ${episodeInfo} Все серии с качественной русской озвучкой, удобный плеер и возможность оставлять комментарии.`;

  // Изображение обложки или дефолтное
  const image = title.coverKey
    ? getAbsoluteUrl(`/media/covers/${encodeURIComponent(title.coverKey)}`)
    : getAbsoluteUrl("/og-image.png");
  
  const imageAlt = title.coverKey
    ? `Обложка аниме ${titleName}`
    : `DreamyVoice — ${titleName}`;

  // Для обложек тайтлов не указываем фиксированные размеры,
  // так как они могут быть разными. Социальные сети сами определят размеры.
  const ogImage: OpenGraphImages = title.coverKey
    ? [
        {
          url: image,
          alt: imageAlt,
          // Не указываем width/height для пользовательских обложек,
          // так как их размеры могут быть разными
        },
      ]
    : [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: "image/png",
        },
      ];

  // Оптимизируем описания для разных платформ
  const ogDescription = truncateDescription(fullDescription, 300);
  const twitterDescription = truncateDescription(fullDescription, 200);
  const ogTitle = `${titleName} | DreamyVoice`;

  return {
    title: titleName,
    description: fullDescription, // Полное описание для поисковых систем
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: "DreamyVoice",
      title: ogTitle,
      description: ogDescription, // Оптимизированное описание для OG
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: twitterDescription, // Оптимизированное описание для Twitter
      images: [
        {
          url: image,
          alt: imageAlt,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
    // Дополнительные мета-теги для VK, Telegram и других платформ
    other: {
      "vk:title": ogTitle,
      "vk:description": ogDescription,
      "vk:image": image,
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
    : getAbsoluteUrl("/og-image.png");

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
    logo: getAbsoluteUrl("/og-image.png"),
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
