/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getTitles, getGenres, getTags } from "@/lib/server-api";
import type { Title } from "@/lib/types";
import { buildMediaUrl } from "@/lib/media";
import { detectGenres } from "@/lib/genres";
import { getReleaseDate, sortTitlesByReleaseDateDesc } from "@/lib/title-utils";
import {
  AGE_RATING_SET,
  AGE_RATINGS,
  detectAgeRating,
  detectTags,
} from "@/lib/catalog-keywords";
import { CatalogFiltersDock } from "./catalog-filters-dock";
import { CatalogFiltersForm } from "./catalog-filters-form";
import {
  CatalogFilterState,
  DEFAULT_SORT,
  SortOption,
  SORT_OPTIONS,
} from "./catalog-filter-config";

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
  sort?: string | string[];
};

type EnrichedTitle = Title & {
  releaseYear: number;
  genres: string[];
  progress: "ongoing" | "completed";
  tags: string[];
  ageRating: (typeof AGE_RATINGS)[number] | null;
};

const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const buildCatalogFilters = (
  searchParams?: HomePageSearchParams
): CatalogFilterState => {
  const rawQuery = getParamValue(searchParams?.query)?.trim() ?? "";
  const rawYear = getParamValue(searchParams?.year) ?? "all";
  const rawYearFrom = getParamValue(searchParams?.yearFrom) ?? "";
  const rawYearTo = getParamValue(searchParams?.yearTo) ?? "";
  const rawStatus =
    getParamValue(searchParams?.status) ??
    getParamValue(searchParams?.progress) ??
    "all";
  const rawGenre = getParamValue(searchParams?.genre)?.trim() ?? "";
  const rawTag = getParamValue(searchParams?.tag)?.trim() ?? "";
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
  const genre = rawGenre || undefined;
  const tag = rawTag || undefined;
  const ageRating =
    rawRating && AGE_RATING_SET.has(rawRating)
      ? (rawRating as (typeof AGE_RATINGS)[number])
      : undefined;
  const rawSort = getParamValue(searchParams?.sort)?.toLowerCase();
  const sort: SortOption = SORT_OPTIONS.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : DEFAULT_SORT;

  return {
    query: rawQuery,
    yearFrom,
    yearTo,
    genre,
    tag,
    status,
    ageRating,
    sort,
  };
};

const detectProgress = (title: Title): EnrichedTitle["progress"] => {
  const hasUnreleasedEpisodes = title.episodes.some(
    (episode) => !episode.published
  );
  if (title.published && !hasUnreleasedEpisodes) {
    return "completed";
  }
  return "ongoing";
};

const enrichTitles = (titles: Title[]): EnrichedTitle[] =>
  titles.map((title) => {
    const releaseYear = getReleaseDate(title).getFullYear();
    return {
      ...title,
      releaseYear,
      genres:
        title.genres && title.genres.length > 0
          ? title.genres
          : detectGenres(title.description),
      progress: detectProgress(title),
      tags:
        title.tags && title.tags.length > 0
          ? title.tags
          : detectTags(title.description),
      ageRating:
        title.ageRating && AGE_RATING_SET.has(title.ageRating)
          ? (title.ageRating as (typeof AGE_RATINGS)[number])
          : detectAgeRating(title.description),
    };
  });

const sortTitles = (
  titles: EnrichedTitle[],
  sortOption: SortOption
): EnrichedTitle[] => {
  const sorted = [...titles];
  sorted.sort((a, b) => {
    if (sortOption === "name_asc") {
      return a.name.localeCompare(b.name, "ru", { sensitivity: "base" });
    }
    if (sortOption === "name_desc") {
      return b.name.localeCompare(a.name, "ru", { sensitivity: "base" });
    }
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return sortOption === "created_desc" ? bDate - aDate : aDate - bDate;
  });
  return sorted;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: HomePageSearchParams;
}) {
  const [titles, genreOptions, tagOptions] = await Promise.all([
    getTitles(),
    getGenres(),
    getTags(),
  ]);
  const latestTitles = sortTitlesByReleaseDateDesc(titles).slice(0, 4);
  const catalogFilters = buildCatalogFilters(searchParams);
  const enrichedTitles = enrichTitles(titles);

  const availableYears = Array.from(
    new Set(enrichedTitles.map((title) => title.releaseYear))
  ).sort((a, b) => b - a);

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
    const matchesGenres = catalogFilters.genre
      ? title.genres.includes(catalogFilters.genre)
      : true;
    const matchesTags = catalogFilters.tag
      ? title.tags.includes(catalogFilters.tag)
      : true;
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

  const sortedTitles = sortTitles(filteredTitles, catalogFilters.sort);

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
                  <div
                    className={`latest-cover${
                      title.coverKey ? "" : " latest-cover--empty"
                    }`}
                  >
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
          <p className="catalog-subtitle">
            Подборка релизов команды DreamyVoice
          </p>
        </div>
        {titles.length === 0 ? (
          <p className="catalog-empty">
            Пока ничего нет. Добавьте первый тайтл через админку.
          </p>
        ) : (
          <div className="catalog-layout">
            <div className="catalog-results">
              {sortedTitles.length === 0 ? (
                <p className="catalog-empty catalog-empty--compact">
                  Ничего не найдено. Попробуйте изменить параметры фильтра.
                </p>
              ) : (
                <ul className="catalog-grid" role="list">
                  {sortedTitles.map((title) => (
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
                <CatalogFiltersForm
                  filters={catalogFilters}
                  availableYears={availableYears}
                  genreOptions={genreOptions}
                  tagOptions={tagOptions}
                />
              </aside>
            </CatalogFiltersDock>
          </div>
        )}
      </section>
    </>
  );
}
