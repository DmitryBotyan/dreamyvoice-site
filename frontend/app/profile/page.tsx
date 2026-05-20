import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getCurrentUser, getMyAnimeList } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { AnimeListStatus } from "@/lib/types";
import { ProfileForm } from "./profile-form";
import { EmailSection } from "./email-section";
import { AvatarUploadButton } from "./avatar-upload-button";
import { ProfileTabs } from "./profile-tabs";
import { AnimeGroup } from "./anime-group";
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

  const recentActivity = animeEntries.slice(0, 6);

  const profileContent = (
    <div className={styles.tabContent}>
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
              <AnimeGroup
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                entries={entries.map((e) => e.title)}
              />
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
    </div>
  );

  const settingsContent = (
    <div className={styles.tabContent}>
      <EmailSection user={currentUser} />
      <div className={styles.profilePanel}>
        <div className={styles.profilePanelHeader}>
          <h2>Основная информация</h2>
        </div>
        <ProfileForm user={currentUser} />
      </div>
    </div>
  );

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
          {currentUser.bio && (
            <p className={styles.profileBio}>{currentUser.bio}</p>
          )}
          <Link href={`/users/${currentUser.profileId}`} className={styles.profilePublicLink}>
            Открыть публичный профиль
          </Link>
        </div>
      </header>

      <ProfileTabs
        profileContent={profileContent}
        settingsContent={settingsContent}
      />
    </section>
  );
}
