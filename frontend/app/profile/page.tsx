import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getMyAnimeList } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { AnimeListStatus, AnimeListTitle } from "@/lib/types";
import { ProfileForm } from "./profile-form";
import { EmailSection } from "./email-section";
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

  return (
    <section className={styles.profileSection}>
      <header className={styles.profileHero}>
        <div className={styles.profileAvatarFrame}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Текущий аватар"
              width={108}
              height={108}
              className={styles.profileAvatar}
            />
          ) : (
            <span className={styles.profileAvatarFallback}>
              {currentUser.username[0]}
            </span>
          )}
        </div>
        <div className={styles.profileHeroContent}>
          <h1>{currentUser.username}</h1>
          <div className={styles.profileMetaRow}>
            {roleLabel && <span className={styles.profileBadge}>{roleLabel}</span>}
            <span>С нами с {joinedDate}</span>
          </div>
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
          <p className={styles.profileAnimeEmpty}>
            Вы ещё не добавили ни одного аниме. Найдите тайтл и нажмите «В список».
          </p>
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
