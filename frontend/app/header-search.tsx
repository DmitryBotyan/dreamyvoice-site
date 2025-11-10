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
    <div className={`header-search${showResults ? " header-search--open" : ""}`}>
      <label className="header-search-label">
        <span className="sr-only">Поиск по тайтлам</span>
        <input
          type="search"
          className="header-search-input"
          placeholder="Поиск серии"
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
