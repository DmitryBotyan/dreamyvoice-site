/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getTitles } from "@/lib/server-api";
import type { Title } from "@/lib/types";
import { buildMediaUrl } from "@/lib/media";
import { GENRE_KEYWORD_SET, GENRE_KEYWORDS, detectGenres } from "@/lib/genres";

type HomePageSearchParams = {
  query?: string | string[];
  minEpisodes?: string | string[];
  year?: string | string[];
  genre?: string | string[];
  progress?: string | string[];
};

type CatalogFilterState = {
  query: string;
  minEpisodes: number;
  year: "all" | `${number}`;
  genres: string[];
  progress: "all" | "ongoing" | "completed";
};

type EnrichedTitle = Title & {
  releaseYear: number;
  genres: string[];
  progress: "ongoing" | "completed";
};

const getParamValue = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

const getParamValues = (value?: string | string[]) =>
  Array.isArray(value) ? value : value ? [value] : [];

const buildCatalogFilters = (searchParams?: HomePageSearchParams): CatalogFilterState => {
  const rawQuery = getParamValue(searchParams?.query)?.trim() ?? "";
  const rawMinEpisodes = getParamValue(searchParams?.minEpisodes) ?? "";
  const rawYear = getParamValue(searchParams?.year) ?? "all";
  const rawProgress = getParamValue(searchParams?.progress) ?? "all";
  const rawGenres = getParamValues(searchParams?.genre);

  const minEpisodesNumber = Number.parseInt(rawMinEpisodes, 10);
  const year: CatalogFilterState["year"] =
    rawYear !== "all" && /^\d{4}$/.test(rawYear) ? (rawYear as `${number}`) : "all";
  const progress: CatalogFilterState["progress"] =
    rawProgress === "ongoing" || rawProgress === "completed" ? rawProgress : "all";

  return {
    query: rawQuery,
    minEpisodes:
      Number.isFinite(minEpisodesNumber) && minEpisodesNumber > 0 ? minEpisodesNumber : 0,
    year,
    genres: rawGenres
      .map((genre) => genre.toLowerCase())
      .filter((genre): genre is (typeof GENRE_KEYWORDS)[number] => GENRE_KEYWORD_SET.has(genre)),
    progress,
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
  }));

export default async function HomePage({ searchParams }: { searchParams?: HomePageSearchParams }) {
  const titles: Title[] = await getTitles();
  const latestTitles = titles.slice(0, 4);
  const catalogFilters = buildCatalogFilters(searchParams);
  const enrichedTitles = enrichTitles(titles);

  const availableYears = Array.from(new Set(enrichedTitles.map((title) => title.releaseYear))).sort(
    (a, b) => b - a,
  );
  const availableGenres = Array.from(
    new Set(enrichedTitles.flatMap((title) => title.genres)),
  ).sort((a, b) => a.localeCompare(b));

  const filteredTitles = enrichedTitles.filter((title) => {
    const matchesQuery = catalogFilters.query
      ? title.name.toLowerCase().includes(catalogFilters.query.toLowerCase())
      : true;
    const matchesMinEpisodes = catalogFilters.minEpisodes
      ? title.episodes.length >= catalogFilters.minEpisodes
      : true;
    const matchesYear =
      catalogFilters.year === "all"
        ? true
        : title.releaseYear.toString() === catalogFilters.year;
    const matchesGenres =
      catalogFilters.genres.length === 0
        ? true
        : catalogFilters.genres.every((genre) => title.genres.includes(genre));
    const matchesProgress =
      catalogFilters.progress === "all"
        ? true
        : title.progress === catalogFilters.progress;

    return (
      matchesQuery && matchesMinEpisodes && matchesYear && matchesGenres && matchesProgress
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
                {availableYears.length > 0 && (
                  <div className="catalog-filter-group">
                    <label className="catalog-filter-label" htmlFor="catalog-filter-year">
                      Год релиза
                    </label>
                    <select
                      id="catalog-filter-year"
                      name="year"
                      defaultValue={catalogFilters.year}
                      className="catalog-filter-select"
                    >
                      <option value="all">Все годы</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="catalog-filter-group">
                  <span className="catalog-filter-label">Жанры</span>
                  {availableGenres.length === 0 ? (
                    <p className="catalog-filter-hint">Добавьте описания тайтлов, чтобы отобразить жанры.</p>
                  ) : (
                    <div className="catalog-filter-genres">
                      {availableGenres.map((genre) => {
                        const isActive = catalogFilters.genres.includes(genre);
                        const label = genre.charAt(0).toUpperCase() + genre.slice(1);
                        return (
                          <label
                            key={genre}
                            className={`catalog-filter-genre${isActive ? " catalog-filter-genre--active" : ""}`}
                          >
                            <input
                              type="checkbox"
                              name="genre"
                              value={genre}
                              defaultChecked={isActive}
                              className="catalog-filter-genre-checkbox"
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label" htmlFor="catalog-filter-progress">
                    Статус выхода
                  </label>
                  <select
                    id="catalog-filter-progress"
                    name="progress"
                    defaultValue={catalogFilters.progress}
                    className="catalog-filter-select"
                  >
                    <option value="all">Все тайтлы</option>
                    <option value="ongoing">Онгоинги</option>
                    <option value="completed">Завершенные</option>
                  </select>
                </div>
                <div className="catalog-filter-group">
                  <label className="catalog-filter-label" htmlFor="catalog-filter-min-episodes">
                    Минимум серий
                  </label>
                  <input
                    id="catalog-filter-min-episodes"
                    name="minEpisodes"
                    type="number"
                    min={0}
                    placeholder="0"
                    defaultValue={catalogFilters.minEpisodes || ""}
                    className="catalog-filter-input"
                  />
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
                      <div className="catalog-card-content">
                        <h2 className="catalog-card-title">{title.name}</h2>
                        <p className="catalog-card-meta">
                          Серий: {title.episodes.length}{" "}
                          {title.published ? "" : "(черновик)"}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </>
  );
}
