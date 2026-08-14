"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
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

// Debounce delay для поля поиска (мс)
const SEARCH_DEBOUNCE_MS = 400;

export function CatalogFiltersForm({
  filters,
  genreOptions,
  tagOptions,
}: CatalogFiltersFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Локальное состояние для полей с debounce (для мгновенного отображения ввода)
  const [queryInput, setQueryInput] = useState(filters.query);
  const [yearFromInput, setYearFromInput] = useState(filters.yearFromInput);
  const [yearToInput, setYearToInput] = useState(filters.yearToInput);
  
  // Таймеры debounce для разных полей
  const debounceTimersRef = useRef<{
    query: NodeJS.Timeout | null;
    yearFrom: NodeJS.Timeout | null;
    yearTo: NodeJS.Timeout | null;
  }>({
    query: null,
    yearFrom: null,
    yearTo: null,
  });

  // Синхронизируем локальное состояние с props при изменении извне (например, при сбросе)
  useEffect(() => {
    setQueryInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setYearFromInput(filters.yearFromInput);
  }, [filters.yearFromInput]);

  useEffect(() => {
    setYearToInput(filters.yearToInput);
  }, [filters.yearToInput]);

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
      // Новая выборка — всегда с первой страницы.
      nextParams.delete("page");

      const query = nextParams.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams]
  );

  // Функция для применения фильтра с trim (используется в debounce и при немедленном применении)
  const applyQueryFilter = useCallback(
    (value: string) => {
      const trimmedValue = value.trim();
      updateParams({ query: trimmedValue || undefined });
    },
    [updateParams]
  );

  // Обработчик для поля поиска с debounce
  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setQueryInput(value); // Мгновенное обновление UI

      // Очищаем предыдущий таймер
      if (debounceTimersRef.current.query) {
        clearTimeout(debounceTimersRef.current.query);
      }

      // Устанавливаем новый таймер для обновления URL после паузы ввода
      debounceTimersRef.current.query = setTimeout(() => {
        applyQueryFilter(value);
      }, SEARCH_DEBOUNCE_MS);
    },
    [applyQueryFilter]
  );

  // Немедленное применение фильтра при нажатии Enter
  const handleQueryKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        // Отменяем debounce
        if (debounceTimersRef.current.query) {
          clearTimeout(debounceTimersRef.current.query);
          debounceTimersRef.current.query = null;
        }
        // Применяем trim и обновляем URL
        const trimmedValue = queryInput.trim();
        updateParams({ query: trimmedValue || undefined });
      }
    },
    [queryInput, updateParams]
  );

  // Немедленное применение фильтра при потере фокуса
  const handleQueryBlur = useCallback(() => {
    // Отменяем debounce
    if (debounceTimersRef.current.query) {
      clearTimeout(debounceTimersRef.current.query);
      debounceTimersRef.current.query = null;
    }
    // Применяем trim и обновляем URL
    const trimmedValue = queryInput.trim();
    updateParams({ query: trimmedValue || undefined });
  }, [queryInput, updateParams]);

  // Обработчик для полей года с debounce
  const handleYearInput = useCallback(
    (key: "yearFrom" | "yearTo") => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      
      // Мгновенное обновление UI
      if (key === "yearFrom") {
        setYearFromInput(value);
      } else {
        setYearToInput(value);
      }

      // Очищаем предыдущий таймер для этого поля
      if (debounceTimersRef.current[key]) {
        clearTimeout(debounceTimersRef.current[key]);
      }

      // Устанавливаем новый таймер для обновления URL после паузы ввода
      debounceTimersRef.current[key] = setTimeout(() => {
        updateParams({ [key]: value || undefined });
      }, SEARCH_DEBOUNCE_MS);
    },
    [updateParams]
  );

  // Немедленное применение фильтра года при нажатии Enter
  const handleYearKeyDown = useCallback(
    (key: "yearFrom" | "yearTo") => (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        // Отменяем debounce
        if (debounceTimersRef.current[key]) {
          clearTimeout(debounceTimersRef.current[key]);
          debounceTimersRef.current[key] = null;
        }
        // Обновляем URL сразу
        const value = key === "yearFrom" ? yearFromInput : yearToInput;
        updateParams({ [key]: value || undefined });
      }
    },
    [yearFromInput, yearToInput, updateParams]
  );

  // Немедленное применение фильтра года при потере фокуса
  const handleYearBlur = useCallback(
    (key: "yearFrom" | "yearTo") => () => {
      // Отменяем debounce
      if (debounceTimersRef.current[key]) {
        clearTimeout(debounceTimersRef.current[key]);
        debounceTimersRef.current[key] = null;
      }
      // Обновляем URL сразу
      const value = key === "yearFrom" ? yearFromInput : yearToInput;
      updateParams({ [key]: value || undefined });
    },
    [yearFromInput, yearToInput, updateParams]
  );

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach((timer) => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    };
  }, []);

  // Обработчик для других полей ввода (без debounce)
  const handleInputChange = useCallback(
    (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
      updateParams({ [key]: event.currentTarget.value });
    },
    [updateParams]
  );

  const handleSelectChange = useCallback(
    (key: string) => (event: ChangeEvent<HTMLSelectElement>) => {
      updateParams({ [key]: event.currentTarget.value });
    },
    [updateParams]
  );

  const handleReset = () => {
    // Очищаем все debounce таймеры при сбросе
    Object.values(debounceTimersRef.current).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    debounceTimersRef.current = {
      query: null,
      yearFrom: null,
      yearTo: null,
    };
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
            value={queryInput}
            placeholder="Введите название"
            className="catalog-filter-input"
            onChange={handleQueryChange}
            onKeyDown={handleQueryKeyDown}
            onBlur={handleQueryBlur}
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
                value={yearFromInput}
                className="catalog-filter-input"
                onChange={handleYearInput("yearFrom")}
                onKeyDown={handleYearKeyDown("yearFrom")}
                onBlur={handleYearBlur("yearFrom")}
              />
            </label>
            <label htmlFor="catalog-filter-year-to">
              <input
                id="catalog-filter-year-to"
                name="yearTo"
                type="number"
                placeholder="Напр. 2024"
                value={yearToInput}
                className="catalog-filter-input"
                onChange={handleYearInput("yearTo")}
                onKeyDown={handleYearKeyDown("yearTo")}
                onBlur={handleYearBlur("yearTo")}
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
