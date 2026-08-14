"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortOption } from "./catalog-filter-config";
import { SORT_OPTIONS } from "./catalog-filter-config";
import { buildCatalogFiltersFromUrl } from "./catalog-filter-utils";
import { Select } from "./ui/select";

const SORT_LABELS: Record<SortOption, string> = {
  name_asc: "Название (А–Я)",
  name_desc: "Название (Я–А)",
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
    (nextValue: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        nextParams.set("sort", nextValue);
      } else {
        nextParams.delete("sort");
      }
      // Смена сортировки перестраивает выдачу — возвращаемся на первую страницу.
      nextParams.delete("page");

      const query = nextParams.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  return (
    <div className="catalog-heading-sort-right">
      <Select
        ariaLabel="Сортировка каталога"
        options={SORT_OPTIONS.map((sortOption) => ({
          value: sortOption,
          label: SORT_LABELS[sortOption],
        }))}
        value={currentSort}
        onChange={handleSortChange}
      />
    </div>
  );
}
