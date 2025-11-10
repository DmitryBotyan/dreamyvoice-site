import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTitleForm } from "./create-title-form";
import { getCurrentUser, getTitles } from "@/lib/server-api";
import type { Title } from "@/lib/types";
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
