"use client";

import { useCallback, useTransition, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AGE_RATINGS } from "@/lib/catalog-keywords";
import { CatalogFilterState } from "./catalog-filter-config";

type CatalogFiltersFormProps = {
  filters: CatalogFilterState;
  genreOptions: string[];
  tagOptions: string[];
};

const formatLabel = (value: string) =>
  value.toUpperCase() === value
    ? value
    : `${value[0].toUpperCase()}${value.slice(1)}`;

export function CatalogFiltersForm({
  filters,
  genreOptions,
  tagOptions,
}: CatalogFiltersFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (changes: Record<string, string | undefined>) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });

      const query = nextParams.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams]
  );

  const handleInputChange = useCallback(
    (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
      updateParams({ [key]: event.currentTarget.value.trim() });
    },
    [updateParams]
  );

  const handleSelectChange = useCallback(
    (key: string) => (event: ChangeEvent<HTMLSelectElement>) => {
      updateParams({ [key]: event.currentTarget.value });
    },
    [updateParams]
  );

  const handleYearInput = useCallback(
    (key: "yearFrom" | "yearTo") => (event: ChangeEvent<HTMLInputElement>) => {
      updateParams({ [key]: event.currentTarget.value });
    },
    [updateParams]
  );

  const handleReset = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <form
      className="catalog-filter-form"
      onSubmit={(event) => event.preventDefault()}
      role="search"
    >
      <div className="catalog-filter-body">
        <div className="catalog-filter-group">
          <input
            id="catalog-filter-query"
            name="query"
            type="search"
            value={filters.query}
            placeholder="Введите название"
            className="catalog-filter-input"
            onChange={handleInputChange("query")}
          />
        </div>
        <div className="catalog-filter-group">
          <div className="catalog-filter-range">
            <label htmlFor="catalog-filter-year-from">
              <input
                id="catalog-filter-year-from"
                name="yearFrom"
                type="number"
                placeholder="Напр. 2015"
                value={filters.yearFromInput}
                className="catalog-filter-input"
                onChange={handleYearInput("yearFrom")}
              />
            </label>
            <label htmlFor="catalog-filter-year-to">
              <input
                id="catalog-filter-year-to"
                name="yearTo"
                type="number"
                placeholder="Напр. 2024"
                value={filters.yearToInput}
                className="catalog-filter-input"
                onChange={handleYearInput("yearTo")}
              />
            </label>
          </div>
        </div>
        <div className="catalog-filter-group">
          <select
            id="catalog-filter-genres"
            name="genre"
            value={filters.genre ?? ""}
            className="catalog-filter-select"
            onChange={handleSelectChange("genre")}
          >
            <option value="">Все жанры</option>
            {genreOptions.map((genre) => (
              <option key={genre} value={genre}>
                {formatLabel(genre)}
              </option>
            ))}
          </select>
        </div>
        <div className="catalog-filter-group">
          <select
            id="catalog-filter-tags"
            name="tag"
            value={filters.tag ?? ""}
            className="catalog-filter-select"
            onChange={handleSelectChange("tag")}
          >
            <option value="">Все теги</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {formatLabel(tag)}
              </option>
            ))}
          </select>
        </div>
        <div className="catalog-filter-group">
          <select
            id="catalog-filter-status"
            name="status"
            value={filters.status}
            className="catalog-filter-select"
            onChange={handleSelectChange("status")}
          >
            <option value="all">Все статусы</option>
            <option value="ongoing">Онгоинг</option>
            <option value="released">Выпущено</option>
          </select>
        </div>
        <div className="catalog-filter-group">
          <select
            id="catalog-filter-rating"
            name="rating"
            value={filters.ageRating ?? ""}
            className="catalog-filter-select"
            onChange={handleSelectChange("rating")}
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
          <button
            type="button"
            className="catalog-filter-reset"
            onClick={handleReset}
          >
            Сбросить
          </button>
        </div>
      </div>
    </form>
  );
}
