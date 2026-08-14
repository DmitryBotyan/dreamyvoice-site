"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clientConfig } from "@/lib/client-config";
import styles from "./styles.module.css";

type SearchHit = {
  type: "title" | "news" | "team" | "comment";
  id: string;
  label: string;
  hint: string;
  href: string;
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function AdminSearch() {
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Ответы приходят вразнобой — принимаем только последний запрос.
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${clientConfig.apiProxyBasePath}/admin-search?q=${encodeURIComponent(trimmed)}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("search failed");
        }
        const data = (await response.json()) as { results: SearchHit[] };
        if (requestIdRef.current === requestId) {
          setResults(data.results);
          setActiveIndex(0);
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setResults([]);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Cmd/Ctrl+K — привычный способ добраться до поиска.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const go = useCallback(
    (hit: SearchHit) => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      inputRef.current?.blur();
      router.push(hit.href);
    },
    [router]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || results.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const hit = results[activeIndex];
      if (hit) {
        go(hit);
      }
    }
  };

  const showPanel =
    isOpen && (trimmed.length >= MIN_QUERY_LENGTH || results.length > 0);

  return (
    <div className={styles.search} ref={rootRef}>
      <input
        ref={inputRef}
        type="search"
        className={styles.searchInput}
        placeholder="Поиск по админке"
        aria-label="Поиск по админке"
        aria-expanded={showPanel}
        aria-controls={showPanel ? listboxId : undefined}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showPanel ? (
        <div className={styles.searchPanel}>
          {isLoading && results.length === 0 ? (
            <p className={styles.searchEmpty}>Ищем…</p>
          ) : results.length === 0 ? (
            <p className={styles.searchEmpty}>Ничего не найдено</p>
          ) : (
            <ul id={listboxId} className={styles.searchResults} role="listbox">
              {results.map((hit, index) => (
                <li key={`${hit.type}-${hit.id}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`${styles.searchResult}${
                      index === activeIndex ? ` ${styles.searchResultActive}` : ""
                    }`}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => go(hit)}
                  >
                    <span className={styles.searchResultLabel}>{hit.label}</span>
                    <span className={styles.searchResultHint}>{hit.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
