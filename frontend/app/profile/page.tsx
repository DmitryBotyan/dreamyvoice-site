import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getCurrentUser, getMyAnimeList } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { AnimeListStatus, AnimeListTitle } from "@/lib/types";
import { ProfileForm } from "./profile-form";
import { EmailSection } from "./email-section";
import { AvatarUploadButton } from "./avatar-upload-button";
import styles from "./profile.module.css";
import { createBaseMetadata, getAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = createBaseMetadata({
  title: "Профиль пользователя",
  description:
    "Управление профилем на DreamyVoice. Измените аватар, никнейм и другие настройки аккаунта.",
  url: getAbsoluteUrl("/profile"),
  robots: {
    index: false,
    follow: false,
  },
});

const STATUS_LABELS: Record<AnimeListStatus, string> = {
  WATCHING: "Смотрю",
  WATCHED: "Просмотрено",
  PLANNED: "В планах",
  DROPPED: "Брошено",
};
const STATUS_ORDER: AnimeListStatus[] = ["WATCHING", "WATCHED", "PLANNED", "DROPPED"];

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

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/profile");
  }

  const animeEntries = await getMyAnimeList();

  const avatarUrl = currentUser.avatarKey
    ? buildMediaUrl("avatars", currentUser.avatarKey)
    : null;
  const joinedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(currentUser.createdAt));
  const roleLabel =
    currentUser.role === "ADMIN" ? "Администратор" : null;

  const statCounts = STATUS_ORDER.map((s) => ({
    status: s,
    count: animeEntries.filter((e) => e.status === s).length,
  })).filter((s) => s.count > 0);

  const recentActivity = animeEntries.slice(0, 6);

  return (
    <section className={styles.profileSection}>
      <header className={styles.profileHero}>
        <AvatarUploadButton
          avatarUrl={avatarUrl}
          fallbackLetter={currentUser.username[0].toUpperCase()}
        />
        <div className={styles.profileHeroContent}>
          <h1>{currentUser.username}</h1>
          <div className={styles.profileMetaRow}>
            {roleLabel && <span className={styles.profileBadge}>{roleLabel}</span>}
            <span>С нами с {joinedDate}</span>
          </div>
          {statCounts.length > 0 && (
            <div className={styles.profileStats}>
              {statCounts.map((s, i) => (
                <span key={s.status} className={styles.profileStatItem}>
                  {i > 0 && <span className={styles.profileStatDot} aria-hidden="true">·</span>}
                  {STATUS_LABELS[s.status]} {s.count}
                </span>
              ))}
            </div>
          )}
          {currentUser.bio && (
            <p className={styles.profileBio}>{currentUser.bio}</p>
          )}
          {currentUser.favoriteGenres && currentUser.favoriteGenres.length > 0 && (
            <div className={styles.profileGenres}>
              {currentUser.favoriteGenres.map((g) => (
                <span key={g} className={styles.profileGenreChip}>{g}</span>
              ))}
            </div>
          )}
          <Link href={`/users/${encodeURIComponent(currentUser.username)}`} className={styles.profilePublicLink}>
            Открыть публичный профиль →
          </Link>
        </div>
      </header>

      <div className={styles.profilePanel}>
        <div className={styles.profilePanelHeader}>
          <h2>Мой аниме-лист</h2>
          {animeEntries.length > 0 && (
            <span className={styles.profileAnimeCount}>{animeEntries.length}</span>
          )}
        </div>
        {animeEntries.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={32} strokeWidth={1.5} className={styles.emptyStateIcon} />
            <p className={styles.emptyStateTitle}>Список пока пуст</p>
            <p className={styles.emptyStateText}>Найдите тайтл и нажмите «В список»</p>
            <Link href="/" className={styles.emptyStateLink}>Перейти в каталог</Link>
          </div>
        ) : (
          STATUS_ORDER.map((status) => {
            const entries = animeEntries.filter((e) => e.status === status);
            if (entries.length === 0) return null;
            return (
              <div key={status} className={styles.profileAnimeGroup}>
                <h3 className={styles.profileAnimeStatus}>
                  {STATUS_LABELS[status]}
                  <span className={styles.profileAnimeStatusCount}>{entries.length}</span>
                </h3>
                <AnimeGrid titles={entries.map((e) => e.title)} />
              </div>
            );
          })
        )}
      </div>

      {recentActivity.length > 0 && (
        <div className={styles.profilePanel}>
          <div className={styles.profilePanelHeader}>
            <h2>Последняя активность</h2>
          </div>
          <div className={styles.activityFeed}>
            {recentActivity.map((e) => (
              <div key={`${e.title.id}-${e.updatedAt}`} className={styles.activityItem}>
                <span className={styles.activityStatus}>{STATUS_LABELS[e.status]}</span>
                <Link href={`/titles/${e.title.slug}`} className={styles.activityTitle}>
                  {e.title.name}
                </Link>
                <span className={styles.activityTime}>{relativeTime(e.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <EmailSection user={currentUser} />

      <div className={styles.profilePanel}>
        <div className={styles.profilePanelHeader}>
          <h2>Основная информация</h2>
        </div>
        <ProfileForm user={currentUser} />
      </div>
    </section>
  );
}

function AnimeGrid({ titles }: { titles: AnimeListTitle[] }) {
  return (
    <ul className={styles.profileAnimeGrid} role="list">
      {titles.map((title) => {
        const coverUrl = title.coverKey ? buildMediaUrl("covers", title.coverKey) : null;
        return (
          <li key={title.id}>
            <Link href={`/titles/${title.slug}`} className={styles.profileAnimeCard} aria-label={title.name}>
              <div className={`${styles.profileAnimeCover}${coverUrl ? "" : ` ${styles.profileAnimeCoverEmpty}`}`}>
                {coverUrl && (
                  <img src={coverUrl} alt={title.name} width={110} height={155} />
                )}
              </div>
              <span className={styles.profileAnimeTitle}>{title.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
