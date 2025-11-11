import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { ProfileForm } from "./profile-form";
import styles from "./profile.module.css";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/profile");
  }

  const avatarUrl = currentUser.avatarKey
    ? buildMediaUrl("avatars", currentUser.avatarKey)
    : null;
  const joinedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(currentUser.createdAt));
  const roleLabel =
    currentUser.role === "ADMIN" ? "Администратор" : "Пользователь";

  return (
    <section className={styles.profileSection}>
      <header className={styles.profileHero}>
        <div className={styles.profileAvatarFrame}>
          {avatarUrl ? (
            <Image
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
            <span className={styles.profileBadge}>{roleLabel}</span>
            <span>С нами с {joinedDate}</span>
          </div>
        </div>
      </header>

      <div className={styles.profilePanel}>
        <div className={styles.profilePanelHeader}>
          <h2>Основная информация</h2>
        </div>
        <ProfileForm user={currentUser} />
      </div>
    </section>
  );
}
