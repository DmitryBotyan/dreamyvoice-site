/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getUserProfile } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { AnimeListStatus, AnimeListTitle } from "@/lib/types";
import { AnimeGroup } from "@/app/profile/anime-group";
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


function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)} г. назад`;
}

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

  const animeList = profile.animeList;
  const recentActivity = profile.recentActivity;

  const totalCount = STATUSES.reduce(
    (sum, s) => sum + (animeList[s]?.length ?? 0),
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
          <div className={styles.emptyState}>
            <BookOpen size={32} strokeWidth={1.5} className={styles.emptyStateIcon} />
            <p className={styles.emptyStateTitle}>Список пока пуст</p>
          </div>
        ) : (
          STATUSES.map((status) => {
            const entries = animeList[status];
            if (!entries || entries.length === 0) return null;
            return (
              <AnimeGroup
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                entries={entries}
              />
            );
          })
        )}
      </div>

      {recentActivity && recentActivity.length > 0 && (
        <div className={styles.activitySection}>
          <h2 className={styles.activityTitle}>Последняя активность</h2>
          <div className={styles.activityFeed}>
            {recentActivity.map((e) => (
              <div key={`${e.title.id}-${e.updatedAt}`} className={styles.activityItem}>
                <span className={styles.activityStatus}>{STATUS_LABELS[e.status]}</span>
                <Link href={`/titles/${e.title.slug}`} className={styles.activityLink}>
                  {e.title.name}
                </Link>
                <span className={styles.activityTime}>{relativeTime(e.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

