"use client";

import { useState } from "react";
import Link from "next/link";
import { buildMediaUrl } from "@/lib/media";
import type { AnimeListTitle } from "@/lib/types";
import styles from "./profile.module.css";

const PREVIEW_COUNT = 6;

type Props = {
  status: string;
  label: string;
  entries: AnimeListTitle[];
};

export function AnimeGroup({ status, label, entries }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = entries.length > PREVIEW_COUNT;
  const visible = expanded ? entries : entries.slice(0, PREVIEW_COUNT);

  return (
    <div className={styles.profileAnimeGroup}>
      <h3 className={styles.profileAnimeStatus}>
        {label}
        <span className={styles.profileAnimeStatusCount}>{entries.length}</span>
      </h3>
      <ul className={styles.profileAnimeGrid} role="list">
        {visible.map((title) => {
          const coverUrl = title.coverKey ? buildMediaUrl("covers", title.coverKey) : null;
          return (
            <li key={title.id}>
              <Link href={`/titles/${title.slug}`} className={styles.profileAnimeCard} aria-label={title.name}>
                <div className={`${styles.profileAnimeCover}${coverUrl ? "" : ` ${styles.profileAnimeCoverEmpty}`}`}>
                  {coverUrl && <img src={coverUrl} alt={title.name} width={110} height={155} />}
                </div>
                <span className={styles.profileAnimeTitle}>{title.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          className={styles.animeGroupToggle}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Свернуть" : `Показать все (${entries.length})`}
        </button>
      )}
    </div>
  );
}
