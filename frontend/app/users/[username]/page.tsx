/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { AnimeListStatus, AnimeListTitle } from "@/lib/types";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Профиль ${username}`,
    robots: { index: false, follow: false },
  };
}

const STATUS_LABELS: Record<AnimeListStatus, string> = {
  WATCHING: "Смотрю",
  WATCHED: "Просмотрено",
  DROPPED: "Брошено",
  PLANNED: "В планах",
};

const STATUSES: AnimeListStatus[] = ["WATCHING", "WATCHED", "PLANNED", "DROPPED"];

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) notFound();

  const avatarUrl = profile.avatarKey
    ? buildMediaUrl("avatars", profile.avatarKey)
    : null;

  const joinedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));

  const roleLabel = profile.role === "ADMIN" ? "Администратор" : null;

  const totalCount = STATUSES.reduce(
    (sum, s) => sum + (profile.animeList[s]?.length ?? 0),
    0,
  );

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.avatarFrame}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Аватар ${profile.username}`}
              width={96}
              height={96}
              className={styles.avatar}
            />
          ) : (
            <span className={styles.avatarFallback}>
              {profile.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.username}>{profile.username}</h1>
          <div className={styles.metaRow}>
            {roleLabel && <span className={styles.badge}>{roleLabel}</span>}
            <span className={styles.since}>С нами с {joinedDate}</span>
          </div>
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        </div>
      </header>

      <div className={styles.listSection}>
        <h2 className={styles.listTitle}>
          Аниме-лист
          {totalCount > 0 && (
            <span className={styles.listCount}>{totalCount}</span>
          )}
        </h2>

        {totalCount === 0 ? (
          <p className={styles.empty}>Список пока пуст.</p>
        ) : (
          STATUSES.map((status) => {
            const entries = profile.animeList[status];
            if (!entries || entries.length === 0) return null;
            return (
              <div key={status} className={styles.statusGroup}>
                <h3 className={styles.statusLabel}>
                  {STATUS_LABELS[status]}
                  <span className={styles.statusCount}>{entries.length}</span>
                </h3>
                <AnimeGrid titles={entries} />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AnimeGrid({ titles }: { titles: AnimeListTitle[] }) {
  return (
    <ul className={styles.grid} role="list">
      {titles.map((title) => {
        const coverUrl = title.coverKey
          ? buildMediaUrl("covers", title.coverKey)
          : null;
        return (
          <li key={title.id} className={styles.card}>
            <Link
              href={`/titles/${title.slug}`}
              className={styles.cardLink}
              aria-label={title.name}
            >
              <div className={`${styles.cover}${coverUrl ? "" : ` ${styles.coverEmpty}`}`}>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={title.name}
                    width={130}
                    height={180}
                  />
                ) : null}
              </div>
              <span className={styles.cardName}>{title.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
