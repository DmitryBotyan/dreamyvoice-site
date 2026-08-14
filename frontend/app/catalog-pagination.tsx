"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  currentPage: number;
  totalPages: number;
  /** Якорь, к которому прокручивается страница после перехода. */
  scrollTargetId?: string;
};

/** Сколько соседних страниц показывать слева и справа от текущей. */
const SIBLING_COUNT = 1;

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      className="catalog-pagination-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={direction === "prev" ? "14.5 5 8 12 14.5 19" : "9.5 5 16 12 9.5 19"} />
    </svg>
  );
}

/**
 * Строит компактный диапазон вида 1 … 4 5 6 … 20:
 * первая и последняя страницы всегда видны, вокруг текущей — соседи.
 */
export const buildPageItems = (
  currentPage: number,
  totalPages: number,
  siblingCount = SIBLING_COUNT
): PageItem[] => {
  // 1 (первая) + 1 (последняя) + текущая + соседи с двух сторон + два многоточия
  const maxVisible = siblingCount * 2 + 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const items: PageItem[] = [1];

  if (showLeftEllipsis) {
    items.push("ellipsis-start");
  }

  const rangeStart = showLeftEllipsis ? leftSibling : 2;
  const rangeEnd = showRightEllipsis ? rightSibling : totalPages - 1;
  for (let page = rangeStart; page <= rangeEnd; page += 1) {
    items.push(page);
  }

  if (showRightEllipsis) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);

  return items;
};

export function CatalogPagination({
  currentPage,
  totalPages,
  scrollTargetId,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = useMemo(() => {
    const base = searchParams.toString();
    return (page: number) => {
      const params = new URLSearchParams(base);
      // Первая страница — канонический URL без параметра.
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }
      const query = params.toString();
      const hash = scrollTargetId ? `#${scrollTargetId}` : "";
      return `${pathname}${query ? `?${query}` : ""}${hash}`;
    };
  }, [pathname, searchParams, scrollTargetId]);

  if (totalPages <= 1) {
    return null;
  }

  const items = buildPageItems(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="catalog-pagination" aria-label="Навигация по страницам каталога">
      {hasPrev ? (
        <Link
          className="catalog-pagination-arrow catalog-pagination-arrow--prev"
          href={buildHref(currentPage - 1)}
          rel="prev"
          aria-label="Предыдущая страница"
        >
          <ChevronIcon direction="prev" />
        </Link>
      ) : (
        <span
          className="catalog-pagination-arrow catalog-pagination-arrow--disabled"
          aria-hidden="true"
        >
          <ChevronIcon direction="prev" />
        </span>
      )}

      <ul className="catalog-pagination-list" role="list">
        {items.map((item) => {
          if (item === "ellipsis-start" || item === "ellipsis-end") {
            return (
              <li key={item} className="catalog-pagination-ellipsis" aria-hidden="true">
                …
              </li>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <li key={item}>
              {isCurrent ? (
                <span
                  className="catalog-pagination-page catalog-pagination-page--current"
                  aria-current="page"
                >
                  {item}
                </span>
              ) : (
                <Link
                  className="catalog-pagination-page"
                  href={buildHref(item)}
                  aria-label={`Страница ${item}`}
                >
                  {item}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {hasNext ? (
        <Link
          className="catalog-pagination-arrow catalog-pagination-arrow--next"
          href={buildHref(currentPage + 1)}
          rel="next"
          aria-label="Следующая страница"
        >
          <ChevronIcon direction="next" />
        </Link>
      ) : (
        <span
          className="catalog-pagination-arrow catalog-pagination-arrow--disabled"
          aria-hidden="true"
        >
          <ChevronIcon direction="next" />
        </span>
      )}
    </nav>
  );
}
