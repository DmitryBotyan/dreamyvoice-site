import type { Title } from "@/lib/types";
import { detectGenres } from "@/lib/genres";
import { getReleaseDate } from "@/lib/title-utils";
import {
  AGE_RATING_SET,
  AGE_RATINGS,
  detectAgeRating,
  detectTags,
} from "@/lib/catalog-keywords";
import {
  CatalogFilterState,
  DEFAULT_SORT,
  SortOption,
  SORT_OPTIONS,
} from "./catalog-filter-config";

export type HomePageSearchParams = {
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

export type EnrichedTitle = Title & {
  releaseYear: number;
  genres: string[];
  progress: "ongoing" | "completed";
  tags: string[];
  ageRating: (typeof AGE_RATINGS)[number] | null;
};

const SEARCH_PARAM_KEYS: Array<keyof HomePageSearchParams> = [
  "query",
  "year",
  "yearFrom",
  "yearTo",
  "genre",
  "progress",
  "status",
  "tag",
  "rating",
  "sort",
];

const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parseYear = (value?: string) =>
  value && /^\d{4}$/.test(value) ? Number.parseInt(value, 10) : undefined;

export const buildCatalogFilters = (
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

export const buildHomePageSearchParamsFromUrl = (
  searchParams: ReadonlyURLSearchParams
): HomePageSearchParams => {
  const parsed: Partial<HomePageSearchParams> = {};

  SEARCH_PARAM_KEYS.forEach((key) => {
    const values = searchParams.getAll(key);
    if (values.length > 1) {
      parsed[key] = values;
      return;
    }
    if (values.length === 1) {
      parsed[key] = values[0];
    }
  });

  return parsed as HomePageSearchParams;
};

export const buildCatalogFiltersFromUrl = (
  searchParams: ReadonlyURLSearchParams
): CatalogFilterState => buildCatalogFilters(buildHomePageSearchParamsFromUrl(searchParams));

const detectProgress = (title: Title): EnrichedTitle["progress"] => {
  const hasUnreleasedEpisodes = title.episodes.some(
    (episode) => !episode.published
  );
  if (title.published && !hasUnreleasedEpisodes) {
    return "completed";
  }
  return "ongoing";
};

export const enrichTitles = (titles: Title[]): EnrichedTitle[] =>
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

export const sortTitles = (
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

export const filterTitles = (
  titles: EnrichedTitle[],
  filters: CatalogFilterState
): EnrichedTitle[] =>
  titles.filter((title) => {
    const matchesQuery = filters.query
      ? title.name.toLowerCase().includes(filters.query.toLowerCase())
      : true;
    const matchesYearFrom =
      typeof filters.yearFrom === "number"
        ? title.releaseYear >= filters.yearFrom
        : true;
    const matchesYearTo =
      typeof filters.yearTo === "number"
        ? title.releaseYear <= filters.yearTo
        : true;
    const matchesGenres = filters.genre
      ? title.genres.includes(filters.genre)
      : true;
    const matchesTags = filters.tag ? title.tags.includes(filters.tag) : true;
    const matchesStatus =
      filters.status === "all"
        ? true
        : filters.status === "released"
        ? title.progress === "completed"
        : title.progress === "ongoing";
    const matchesAgeRating =
      filters.ageRating === undefined
        ? true
        : title.ageRating
        ? title.ageRating === filters.ageRating
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
