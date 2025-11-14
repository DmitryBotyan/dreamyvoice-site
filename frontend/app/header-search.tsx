"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type HeaderSearchProps = {
  titles: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export function HeaderSearch({ titles }: HeaderSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return titles
      .filter((title) => title.name.toLowerCase().startsWith(normalizedQuery))
      .slice(0, 6);
  }, [titles, normalizedQuery]);

  const showResults = isFocused && normalizedQuery.length > 0;

  return (
    <div
      className={`header-search${showResults ? " header-search--open" : ""}`}
    >
      <label className="header-search-label">
        <span className="header-search-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="20"
            height="20"
          >
            <circle cx="11" cy="11" r="7.5" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <span className="sr-only">Поиск по тайтлам</span>
        <input
          type="search"
          className="header-search-input"
          placeholder=""
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </label>
      {showResults && (
        <ul className="header-search-results" role="listbox">
          {suggestions.length === 0 ? (
            <li className="header-search-empty">Ничего не найдено</li>
          ) : (
            suggestions.map((title) => (
              <li key={title.id}>
                <Link
                  href={`/titles/${title.slug}`}
                  className="header-search-result"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {title.name}
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
