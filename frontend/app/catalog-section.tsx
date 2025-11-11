"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { buildMediaUrl } from "@/lib/media";
import { CatalogFiltersDock } from "./catalog-filters-dock";
import { CatalogFiltersForm } from "./catalog-filters-form";
import {
  buildCatalogFiltersFromUrl,
  filterTitles,
  sortTitles,
  type EnrichedTitle,
} from "./catalog-filter-utils";

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

  return (
    <div className="catalog-layout">
      <div className="catalog-results">
        {sortedTitles.length === 0 ? (
          <p className="catalog-empty catalog-empty--compact">
            Ничего не найдено
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
  );
}
