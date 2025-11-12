"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildMediaUrl } from "@/lib/media";
import { CatalogFiltersDock } from "./catalog-filters-dock";
import { CatalogFiltersForm } from "./catalog-filters-form";
import { CatalogSortControl } from "./catalog-sort-control";
import {
  buildCatalogFiltersFromUrl,
  filterTitles,
  sortTitles,
  type EnrichedTitle,
} from "./catalog-filter-utils";

const INITIAL_BATCH = 8;
const LOAD_STEP = 8;

type CatalogSectionProps = {
  titles: EnrichedTitle[];
  availableYears: number[];
  genreOptions: string[];
  tagOptions: string[];
};

export function CatalogSection({
  titles,
  availableYears,
  genreOptions,
  tagOptions,
}: CatalogSectionProps) {
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
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_BATCH, sortedTitles.length)
  );
  const [loadMoreNode, setLoadMoreNode] = useState<HTMLDivElement | null>(null);
  const hasMore = visibleCount < sortedTitles.length;

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_BATCH, sortedTitles.length));
  }, [sortedTitles]);

  useEffect(() => {
    if (!hasMore || !loadMoreNode) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) =>
            Math.min(current + LOAD_STEP, sortedTitles.length)
          );
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(loadMoreNode);
    return () => observer.disconnect();
  }, [hasMore, loadMoreNode, sortedTitles.length, visibleCount]);

  const visibleTitles = sortedTitles.slice(0, visibleCount);

  return (
    <div className="catalog-layout">
      <div className="catalog-heading-block">
        <div className="catalog-heading">
          <h1 className="catalog-title">Каталог тайтлов</h1>
          <p className="catalog-subtitle">
            Подборка релизов команды DreamyVoice
          </p>
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
                        <img
                          src={buildMediaUrl("covers", title.coverKey)!}
                          alt={`Обложка ${title.name}`}
                          width={240}
                          height={320}
                          loading="lazy"
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
            {hasMore && (
              <div
                className="catalog-load-indicator"
                ref={setLoadMoreNode}
                aria-live="polite"
              >
                Подгружаем ещё…
              </div>
            )}
          </>
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
  );
}
