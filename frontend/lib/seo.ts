import type { Metadata } from "next";

type OpenGraphImages = NonNullable<Metadata["openGraph"]>["images"];

/**
 * Название и описание сайта, из которых собираются заголовки вкладок и
 * превью ссылок в мессенджерах. Держим их в одном месте, чтобы описание
 * не расходилось между страницами.
 */
export const SITE_NAME = "DreamyVoice";

export const SITE_TITLE = "DreamyVoice: аниме в озвучке команды";

export const SITE_DESCRIPTION =
  "Каталог аниме в озвучке команды DreamyVoice. Смотрите онгоинги и завершённые тайтлы онлайн бесплатно: серии выходят по мере готовности, есть поиск, фильтры по жанрам, избранное и комментарии.";

/** Ссылки на официальные площадки команды, для разметки организации. */
const SOCIAL_PROFILES = [
  "https://t.me/DreamyVoice_Official",
  "https://vk.com/dreamyvoice",
];

function normalizeSiteUrl(url?: string | null): string {
  const fallback = "https://dreamyvoice.net";
  if (!url) {
    return fallback;
  }
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

/**
 * Получает базовый URL сайта из переменных окружения или возвращает production-домен
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    // Клиентская сторона
    return normalizeSiteUrl(window.location.origin);
  }
  // Серверная сторона — используем переменные окружения или production-домен по умолчанию
  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://dreamyvoice.net"
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
  /** Для новостей: превью оформляется как статья, а не как раздел сайта. */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
  };
  /** Заголовок уже содержит название сайта, приписывать его второй раз не нужно. */
  titleAbsolute?: boolean;
}): Metadata {
  const siteUrl = getSiteUrl();
  const title = overrides?.title || SITE_TITLE;
  const fullDescription = overrides?.description || SITE_DESCRIPTION;

  // Оптимизируем описания для разных платформ
  const ogDescription = truncateDescription(fullDescription, 300); // OG поддерживает до 300 символов
  const twitterDescription = truncateDescription(fullDescription, 200); // Twitter рекомендует до 200 символов
  
  const image = overrides?.image || getAbsoluteUrl("/og-image.png");
  const url = overrides?.url || siteUrl;
  const imageWidth = overrides?.imageWidth ?? 1200;
  const imageHeight = overrides?.imageHeight ?? 630;

  // Создаем абсолютный URL для изображения с поддержкой HTTPS
  const imageUrl = image.startsWith("http") ? image : getAbsoluteUrl(image);

  // Размеры указываем только у своей заставки: у обложек новостей и тайтлов
  // они разные, и заявленные наугад ломают превью.
  const hasKnownSize =
    !overrides?.image || overrides.imageWidth !== undefined;
  const ogImages: OpenGraphImages = hasKnownSize
    ? [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: title,
        },
      ]
    : [{ url: imageUrl, alt: title }];

  const openGraph: Metadata["openGraph"] = overrides?.article
    ? {
        type: "article",
        publishedTime: overrides.article.publishedTime,
        modifiedTime: overrides.article.modifiedTime,
        locale: "ru_RU",
        url,
        siteName: SITE_NAME,
        title,
        description: ogDescription,
        images: ogImages,
      }
    : {
        type: "website",
        locale: "ru_RU",
        url,
        siteName: SITE_NAME,
        title,
        description: ogDescription,
        images: ogImages,
      };

  return {
    metadataBase: new URL(siteUrl),
    // Шаблон «%s | DreamyVoice» живёт в корневом layout, поэтому здесь
    // заголовок страницы отдаётся строкой и название сайта не дублируется.
    title: overrides?.titleAbsolute ? { absolute: title } : title,
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
    openGraph,
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
  const titleName = title.name;
  const url = getAbsoluteUrl(`/titles/${title.slug}`);
  const publishedEpisodes = title.episodes.filter((ep) => ep.published);
  const episodeCount = publishedEpisodes.length;

  // Сколько серий уже выложено: это первое, что хотят знать по ссылке.
  const episodeWord =
    episodeCount % 10 === 1 && episodeCount % 100 !== 11
      ? "серия"
      : [2, 3, 4].includes(episodeCount % 10) &&
        ![12, 13, 14].includes(episodeCount % 100)
      ? "серии"
      : "серий";
  const episodeInfo =
    episodeCount > 0
      ? `На сайте ${episodeCount} ${episodeWord} для просмотра онлайн.`
      : "Серии появятся здесь сразу после выхода озвучки.";

  const baseDescription =
    title.description?.trim() ||
    `${titleName} в озвучке команды DreamyVoice.`;
  const fullDescription = `${baseDescription} ${episodeInfo}`;

  // Изображение обложки или дефолтное
  const image = title.coverKey
    ? getAbsoluteUrl(`/media/covers/${encodeURIComponent(title.coverKey)}`)
    : getAbsoluteUrl("/og-image.png");

  const imageAlt = title.coverKey
    ? `Обложка аниме ${titleName}`
    : `${titleName} в озвучке DreamyVoice`;

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
    episodes: Array<{ number: number; published: boolean }>;
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
          episode: publishedEpisodes.map((ep) => ({
            "@type": "TVEpisode",
            episodeNumber: ep.number,
            name: `Серия ${ep.number}`,
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
    name: SITE_NAME,
    url: siteUrl,
    logo: getAbsoluteUrl("/og-image.png"),
    description:
      "Команда озвучки аниме DreamyVoice: озвучиваем сериалы и выкладываем серии в собственном каталоге.",
    sameAs: SOCIAL_PROFILES,
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
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "ru-RU",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    potentialAction: {
      "@type": "SearchAction",
      // Параметр совпадает с полем поиска в фильтрах каталога.
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Разметка новости, чтобы поиск показывал её как статью с датой. */
export function createNewsJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverKey?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}): object {
  const url = getAbsoluteUrl(`/news/${post.slug}`);
  const image = post.coverKey
    ? getAbsoluteUrl(`/media/covers/${encodeURIComponent(post.coverKey)}`)
    : getAbsoluteUrl("/og-image.png");

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt?.trim() || undefined,
    image,
    url,
    mainEntityOfPage: url,
    inLanguage: "ru-RU",
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: getAbsoluteUrl("/og-image.png"),
      },
    },
  };
}
