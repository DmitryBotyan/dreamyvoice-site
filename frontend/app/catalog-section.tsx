"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildMediaUrl } from "@/lib/media";
import { CoverImage } from "./cover-image";
import { CatalogFiltersDock } from "./catalog-filters-dock";
import { CatalogFiltersForm } from "./catalog-filters-form";
import { CatalogSortControl } from "./catalog-sort-control";
import { CatalogPagination } from "./catalog-pagination";
import { CATALOG_PAGE_SIZE } from "./catalog-filter-config";
import {
  buildCatalogFiltersFromUrl,
  filterTitles,
  getTotalPages,
  parsePageParam,
  sortTitles,
  type EnrichedTitle,
} from "./catalog-filter-utils";
import { NewEpisodeBadge } from "./new-episode-badge";

export const CATALOG_ANCHOR_ID = "catalog";

type CatalogSectionProps = {
  titles: EnrichedTitle[];
  genreOptions: string[];
  tagOptions: string[];
};

export function CatalogSection({
  titles,
  genreOptions,
  tagOptions,
}: CatalogSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const catalogFilters = useMemo(
    () => buildCatalogFiltersFromUrl(searchParams),
    [searchParams]
  );
  const filteredTitles = useMemo(
    () => filterTitles(titles, catalogFilters),
    [titles, catalogFilters]
  );
  const sortedTitles = useMemo(
    () => sortTitles(filteredTitles, catalogFilters.sort),
    [filteredTitles, catalogFilters.sort]
  );

  const totalPages = getTotalPages(sortedTitles.length);
  const requestedPage = parsePageParam(searchParams.get("page") ?? undefined);
  const currentPage = Math.min(requestedPage, totalPages);

  // Страница вне диапазона (после смены фильтров или из чужой ссылки) —
  // чиним URL, чтобы не плодить дубли одного и того же содержимого.
  useEffect(() => {
    if (requestedPage === currentPage) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (currentPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", currentPage.toString());
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [currentPage, pathname, requestedPage, router, searchParams]);

  const visibleTitles = sortedTitles.slice(
    (currentPage - 1) * CATALOG_PAGE_SIZE,
    currentPage * CATALOG_PAGE_SIZE
  );

  return (
    <div className="catalog-layout">
      <div className="catalog-heading-block">
        <div className="catalog-heading">
          <h1 className="catalog-title">Каталог тайтлов</h1>
        </div>
        <CatalogSortControl />
      </div>
      <div className="catalog-results">
        {sortedTitles.length === 0 ? (
          <p className="catalog-empty catalog-empty--compact">
            Ничего не найдено
          </p>
        ) : (
          <>
            <ul className="catalog-grid" role="list">
              {visibleTitles.map((title) => (
                <li key={title.id} className="catalog-card">
                  <Link
                    href={`/titles/${title.slug}`}
                    className="catalog-card-body"
                    aria-label={`Открыть страницу тайтла ${title.name}`}
                  >
                    {title.coverKey ? (
                      <div className="catalog-card-cover">
                        <CoverImage
                          src={buildMediaUrl("covers", title.coverKey)!}
                          alt={`Обложка ${title.name}`}
                          width={240}
                          height={320}
                          blurHash={title.coverBlurHash}
                        />
                        <NewEpisodeBadge
                          slug={title.slug}
                          episodeCount={title.episodes.filter((e) => e.published).length}
                          isOngoing={title.progress === "ongoing"}
                        />
                      </div>
                    ) : (
                      <div className="catalog-card-cover catalog-card-cover--empty">
                        <span>Нет обложки</span>
                        <NewEpisodeBadge
                          slug={title.slug}
                          episodeCount={title.episodes.filter((e) => e.published).length}
                          isOngoing={title.progress === "ongoing"}
                        />
                      </div>
                    )}
                    <h2 className="catalog-card-title" title={title.name}>
                      {title.name}
                    </h2>
                  </Link>
                </li>
              ))}
            </ul>
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              scrollTargetId={CATALOG_ANCHOR_ID}
            />
          </>
        )}
      </div>
      <CatalogFiltersDock>
        <aside className="catalog-filters">
          <CatalogFiltersForm
            filters={catalogFilters}
            genreOptions={genreOptions}
            tagOptions={tagOptions}
          />
        </aside>
      </CatalogFiltersDock>
    </div>
  );
}
