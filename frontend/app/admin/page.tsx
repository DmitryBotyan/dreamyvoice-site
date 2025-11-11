import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTitleForm } from "./create-title-form";
import { TeamMembersForm } from "./team-members-form";
import { getCurrentUser, getTeamMembers, getTitles } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import type { TeamMember, Title } from "@/lib/types";
import styles from "./styles.module.css";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/admin");
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <section>
        <h1>Требуются права администратора</h1>
        <p>
          Вы вошли как {currentUser.username}, но ваша роль не позволяет
          работать с админкой.
        </p>
        <p>
          Вернуться к <Link href="/">каталогу</Link>.
        </p>
      </section>
    );
  }

  const titles: Title[] = await getTitles({ includeDrafts: true });
  const teamMembers: TeamMember[] = await getTeamMembers();

  return (
    <section className={styles.adminSection}>
      <header className={styles.adminHero}>
        <p className={styles.adminEyebrow}>Админ-панель</p>
        <div>
          <h1>Управление контентом</h1>
        </div>
      </header>

      <CreateTitleForm />

      <div className={styles.adminPanel}>
        <div className={styles.panelHeader}>
          <h2>Участники команды ({teamMembers.length})</h2>
          <p>Добавляйте участников, чтобы они отображались на странице команды.</p>
        </div>

        <TeamMembersForm />

          {teamMembers.length === 0 ? (
            <p className={styles.adminEmpty}>
              Участники ещё не добавлены. Создайте первую карточку.
            </p>
          ) : (
            <ul className={styles.teamAdminList}>
            {teamMembers.map((member) => {
              const initials = member.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("");
              const avatarUrl = member.avatarKey ? buildMediaUrl("avatars", member.avatarKey) : null;

              return (
                <li key={member.id} className={styles.teamAdminCard}>
                  <div
                    className={styles.teamAdminAvatar}
                    style={avatarUrl ? { background: "transparent" } : undefined}
                    aria-hidden="true"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`Фото ${member.name}`} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className={styles.teamAdminMeta}>
                    <p className={styles.teamAdminName}>{member.name}</p>
                    <p className={styles.teamAdminRole}>{member.role}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.adminPanel}>
        <div className={styles.panelHeader}>
          <h2>Все тайтлы ({titles.length})</h2>
        </div>
        {titles.length === 0 ? (
          <p className={styles.adminEmpty}>
            Здесь появятся первые релизы после создания.
          </p>
        ) : (
          <ul className={styles.adminListGrid}>
            {titles.map((title) => (
              <li key={title.id}>
                <article className={styles.adminCard}>
                  <header className={styles.adminCardHeader}>
                    <strong className={styles.adminCardTitle}>
                      {title.name}
                    </strong>
                    <span
                      className={`${styles.adminBadge} ${
                        title.published
                          ? styles.adminBadgePublished
                          : styles.adminBadgeDraft
                      }`}
                    >
                      {title.published ? "Опубликован" : "Черновик"}
                    </span>
                  </header>
                  <p className={styles.adminMeta}>Slug: {title.slug}</p>
                  {title.description ? (
                    <p className={styles.adminDescription}>
                      {title.description}
                    </p>
                  ) : null}
                  <p className={styles.adminMeta}>
                    Серий: {title.episodes.length}
                  </p>
                  <p className={styles.adminMeta}>
                    Обновлён:{" "}
                    {new Date(title.updatedAt).toLocaleString("ru-RU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className={styles.adminActionsRow}>
                    <Link
                      className={styles.adminLink}
                      href={`/admin/${title.slug}`}
                    >
                      Редактировать
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
