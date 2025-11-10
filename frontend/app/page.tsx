/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getTitles } from "@/lib/server-api";
import type { Title } from "@/lib/types";
import { buildMediaUrl } from "@/lib/media";
import { GENRE_KEYWORD_SET, GENRE_KEYWORDS, detectGenres } from "@/lib/genres";
import {
  AGE_RATING_SET,
  AGE_RATINGS,
  TAG_KEYWORD_SET,
  TAG_KEYWORDS,
  detectAgeRating,
  detectTags,
} from "@/lib/catalog-keywords";
import { CatalogFiltersDock } from "./catalog-filters-dock";

type HomePageSearchParams = {
  query?: string | string[];
  year?: string | string[]; // deprecated, kept for backward compatibility
  yearFrom?: string | string[];
  yearTo?: string | string[];
  genre?: string | string[];
  progress?: string | string[]; // deprecated, kept for backward compatibility
  status?: string | string[];
  tag?: string | string[];
  rating?: string | string[];
};

type CatalogFilterState = {
  query: string;
  yearFrom?: number;
  yearTo?: number;
  genre?: (typeof GENRE_KEYWORDS)[number];
  tag?: (typeof TAG_KEYWORDS)[number];
  status: "all" | "ongoing" | "released";
  ageRating?: (typeof AGE_RATINGS)[number];
};

type EnrichedTitle = Title & {
  releaseYear: number;
  genres: string[];
  progress: "ongoing" | "completed";
  tags: string[];
  ageRating: (typeof AGE_RATINGS)[number] | null;
};

const getParamValue = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

const buildCatalogFilters = (searchParams?: HomePageSearchParams): CatalogFilterState => {
  const rawQuery = getParamValue(searchParams?.query)?.trim() ?? "";
  const rawYear = getParamValue(searchParams?.year) ?? "all";
  const rawYearFrom = getParamValue(searchParams?.yearFrom) ?? "";
  const rawYearTo = getParamValue(searchParams?.yearTo) ?? "";
  const rawStatus =
    getParamValue(searchParams?.status) ?? getParamValue(searchParams?.progress) ?? "all";
  const rawGenre = getParamValue(searchParams?.genre)?.toLowerCase() ?? "";
  const rawTag = getParamValue(searchParams?.tag)?.toLowerCase() ?? "";
  const rawRating = getParamValue(searchParams?.rating)?.toUpperCase() ?? "";

  const parseYear = (value?: string) =>
    value && /^\d{4}$/.test(value) ? Number.parseInt(value, 10) : undefined;
  const fallbackYear = rawYear !== "all" ? parseYear(rawYear) : undefined;
  const yearFrom = parseYear(rawYearFrom) ?? fallbackYear;
  const yearTo = parseYear(rawYearTo) ?? fallbackYear;
  const status: CatalogFilterState["status"] =
    rawStatus === "ongoing"
      ? "ongoing"
      : rawStatus === "completed" || rawStatus === "released"
        ? "released"
        : "all";
  const genre =
    rawGenre && GENRE_KEYWORD_SET.has(rawGenre)
      ? (rawGenre as (typeof GENRE_KEYWORDS)[number])
      : undefined;
  const tag =
    rawTag && TAG_KEYWORD_SET.has(rawTag)
      ? (rawTag as (typeof TAG_KEYWORDS)[number])
      : undefined;
  const ageRating =
    rawRating && AGE_RATING_SET.has(rawRating)
      ? (rawRating as (typeof AGE_RATINGS)[number])
      : undefined;

  return {
    query: rawQuery,
    yearFrom,
    yearTo,
    genre,
    tag,
    status,
    ageRating,
  };
};

const detectProgress = (title: Title): EnrichedTitle["progress"] => {
  const hasUnreleasedEpisodes = title.episodes.some((episode) => !episode.published);
  if (title.published && !hasUnreleasedEpisodes) {
    return "completed";
  }
  return "ongoing";
};

const enrichTitles = (titles: Title[]): EnrichedTitle[] =>
  titles.map((title) => ({
    ...title,
    releaseYear: new Date(title.createdAt).getFullYear(),
    genres: detectGenres(title.description),
    progress: detectProgress(title),
    tags: detectTags(title.description),
    ageRating: detectAgeRating(title.description),
  }));

export default async function HomePage({ searchParams }: { searchParams?: HomePageSearchParams }) {
  const titles: Title[] = await getTitles();
  const latestTitles = titles.slice(0, 4);
  const catalogFilters = buildCatalogFilters(searchParams);
  const enrichedTitles = enrichTitles(titles);

  const availableYears = Array.from(new Set(enrichedTitles.map((title) => title.releaseYear))).sort(
    (a, b) => b - a,
  );

  const filteredTitles = enrichedTitles.filter((title) => {
    const matchesQuery = catalogFilters.query
      ? title.name.toLowerCase().includes(catalogFilters.query.toLowerCase())
      : true;
    const matchesYearFrom =
      typeof catalogFilters.yearFrom === "number"
        ? title.releaseYear >= catalogFilters.yearFrom
        : true;
    const matchesYearTo =
      typeof catalogFilters.yearTo === "number"
        ? title.releaseYear <= catalogFilters.yearTo
        : true;
    const matchesGenres =
      catalogFilters.genre ? title.genres.includes(catalogFilters.genre) : true;
    const matchesTags = catalogFilters.tag ? title.tags.includes(catalogFilters.tag) : true;
    const matchesStatus =
      catalogFilters.status === "all"
        ? true
        : catalogFilters.status === "released"
          ? title.progress === "completed"
          : title.progress === "ongoing";
    const matchesAgeRating =
      catalogFilters.ageRating === undefined
        ? true
        : title.ageRating
          ? title.ageRating === catalogFilters.ageRating
          : false;

    return (
      matchesQuery &&
      matchesYearFrom &&
      matchesYearTo &&
      matchesGenres &&
      matchesTags &&
      matchesStatus &&
      matchesAgeRating
    );
  });

  return (
    <>
      <section className="latest-section">
        <div className="latest-heading">
          <p className="latest-eyebrow">Новинки</p>
          <h2 className="latest-title">Последние релизы</h2>
        </div>
        {latestTitles.length === 0 ? (
          <p className="latest-empty">
            Как только появятся новые релизы, они сразу отобразятся здесь.
          </p>
        ) : (
          <ul className="latest-grid" role="list">
            {latestTitles.map((title) => (
              <li key={title.id} className="latest-card">
                <Link
                  href={`/titles/${title.slug}`}
                  className="latest-card-link"
                  aria-label={`Открыть страницу тайтла ${title.name}`}
                >
                  <div className={`latest-cover${title.coverKey ? "" : " latest-cover--empty"}`}>
                    {title.coverKey ? (
                      <img
                        src={buildMediaUrl("covers", title.coverKey)!}
                        alt={`Обложка ${title.name}`}
                        width={180}
                        height={240}
                      />
                    ) : (
                      <span className="sr-only">Обложка отсутствует</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <h1 className="catalog-title">Каталог тайтлов</h1>
          <p className="catalog-subtitle">Подборка релизов команды DreamyVoice</p>
        </div>
        {titles.length === 0 ? (
          <p className="catalog-empty">
            Пока ничего нет. Добавьте первый тайтл через админку.
          </p>
        ) : (
          <div className="catalog-layout">
            <div className="catalog-results">
              {filteredTitles.length === 0 ? (
                <p className="catalog-empty catalog-empty--compact">
                  Ничего не найдено. Попробуйте изменить параметры фильтра.
                </p>
              ) : (
                <ul className="catalog-grid" role="list">
                  {filteredTitles.map((title) => (
                    <li key={title.id} className="catalog-card">
                      <Link
                        href={`/titles/${title.slug}`}
                        className="catalog-card-body"
                        aria-label={`Открыть страницу тайтла ${title.name}`}
                      >
                        {title.coverKey ? (
                          <div className="catalog-card-cover">
                            <img
                              src={buildMediaUrl("covers", title.coverKey)!}
                              alt={`Обложка ${title.name}`}
                              width={240}
                              height={320}
                            />
                          </div>
                        ) : (
                          <div className="catalog-card-cover catalog-card-cover--empty">
                            <span>Нет обложки</span>
                          </div>
                        )}
                        <h2 className="catalog-card-title" title={title.name}>
                          {title.name}
                        </h2>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <CatalogFiltersDock>
              <aside className="catalog-filters">
                <form className="catalog-filter-form" method="get">
                  <div className="catalog-filter-group">
                    <label className="catalog-filter-label" htmlFor="catalog-filter-query">
                      Поиск по названию
                    </label>
                    <input
                      id="catalog-filter-query"
                      name="query"
                      type="search"
                      placeholder="Введите название"
                      defaultValue={catalogFilters.query}
                      className="catalog-filter-input"
                    />
                  </div>
                <div className="catalog-filter-group">
                  <span className="catalog-filter-label">Год релиза</span>
                  <div className="catalog-filter-range">
                    <label htmlFor="catalog-filter-year-from">
                      <span>От</span>
                      <input
                        id="catalog-filter-year-from"
                        name="yearFrom"
                        type="number"
                        placeholder="Напр. 2015"
                        defaultValue={catalogFilters.yearFrom?.toString() ?? ""}
                        className="catalog-filter-input"
                        list={availableYears.length > 0 ? "catalog-filter-year-options" : undefined}
                      />
                    </label>
                    <label htmlFor="catalog-filter-year-to">
                      <span>До</span>
                      <input
                        id="catalog-filter-year-to"
                        name="yearTo"
                        type="number"
                        placeholder="Напр. 2024"
                        defaultValue={catalogFilters.yearTo?.toString() ?? ""}
                        className="catalog-filter-input"
                        list={availableYears.length > 0 ? "catalog-filter-year-options" : undefined}
                      />
                    </label>
                  </div>
                  {availableYears.length > 0 ? (
                    <datalist id="catalog-filter-year-options">
                      {availableYears.map((year) => (
                        <option key={`year-option-${year}`} value={year} />
                      ))}
                    </datalist>
                  ) : null}
                </div>
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label" htmlFor="catalog-filter-genres">
                    Жанры
                  </label>
                  <select
                    id="catalog-filter-genres"
                    name="genre"
                    defaultValue={catalogFilters.genre ?? ""}
                    className="catalog-filter-select"
                  >
                    <option value="">Все жанры</option>
                    {GENRE_KEYWORDS.map((genre) => {
                      const label = genre.charAt(0).toUpperCase() + genre.slice(1);
                      return (
                        <option key={genre} value={genre}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label" htmlFor="catalog-filter-tags">
                    Теги
                  </label>
                  <select
                    id="catalog-filter-tags"
                    name="tag"
                    defaultValue={catalogFilters.tag ?? ""}
                    className="catalog-filter-select"
                  >
                    <option value="">Все теги</option>
                    {TAG_KEYWORDS.map((tag) => {
                      const label =
                        tag.toUpperCase() === tag ? tag.toUpperCase() : tag.charAt(0).toUpperCase() + tag.slice(1);
                      return (
                        <option key={tag} value={tag}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label" htmlFor="catalog-filter-status">
                    Статус тайтла
                  </label>
                  <select
                    id="catalog-filter-status"
                    name="status"
                    defaultValue={catalogFilters.status}
                    className="catalog-filter-select"
                  >
                    <option value="all">Все статусы</option>
                    <option value="ongoing">Онгоинг</option>
                    <option value="released">Выпущено</option>
                  </select>
                </div>
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label" htmlFor="catalog-filter-rating">
                    Возрастное ограничение
                  </label>
                  <select
                    id="catalog-filter-rating"
                    name="rating"
                    defaultValue={catalogFilters.ageRating ?? ""}
                    className="catalog-filter-select"
                  >
                    <option value="">Любой рейтинг</option>
                    {AGE_RATINGS.map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="catalog-filter-actions">
                  <button type="submit" className="catalog-filter-submit">
                    Применить
                  </button>
                  <Link href="/" className="catalog-filter-reset">
                    Сбросить
                  </Link>
                </div>
              </form>
            </aside>
          </CatalogFiltersDock>
          </div>
        )}
      </section>
    </>
  );
}
