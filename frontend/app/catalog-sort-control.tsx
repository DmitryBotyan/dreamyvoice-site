"use client";

import type { ChangeEvent } from "react";
import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortOption } from "./catalog-filter-config";
import { SORT_OPTIONS } from "./catalog-filter-config";
import { buildCatalogFiltersFromUrl } from "./catalog-filter-utils";

const SORT_LABELS: Record<SortOption, string> = {
  name_asc: "Название (А→Я)",
  name_desc: "Название (Я→А)",
  created_desc: "Сначала новые",
  created_asc: "Сначала старые",
};

export function CatalogSortControl() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = buildCatalogFiltersFromUrl(searchParams).sort;
  const [, startTransition] = useTransition();

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const nextValue = event.currentTarget.value;
      if (nextValue) {
        nextParams.set("sort", nextValue);
      } else {
        nextParams.delete("sort");
      }

      const query = nextParams.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  return (
    <div className="catalog-heading-sort-right">
      <select
        aria-label="Сортировка каталога"
        className="catalog-filter-select catalog-heading-sort-select"
        value={currentSort}
        onChange={handleSortChange}
      >
        {SORT_OPTIONS.map((sortOption) => (
          <option key={sortOption} value={sortOption}>
            {SORT_LABELS[sortOption]}
          </option>
        ))}
      </select>
    </div>
  );
}
