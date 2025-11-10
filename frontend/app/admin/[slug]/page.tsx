import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getTitle } from "@/lib/server-api";
import { EditTitleForm } from "./edit-title-form";
import { AddEpisodeForm } from "./add-episode-form";
import { createEpisodeAction, updateTitleAction } from "./actions";
import styles from "../styles.module.css";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminTitlePage({ params }: Props) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirect=/admin/${slug}`);
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const title = await getTitle(slug);

  if (!title) {
    notFound();
  }

  const updateAction = updateTitleAction.bind(null, slug);
  const addEpisodeAction = createEpisodeAction.bind(null, slug);

  return (
    <section className={styles.adminSection}>
      <p className={styles.adminBreadcrumb}>
        <Link href="/admin">← Назад к списку</Link>
      </p>
      <header className={styles.adminHero}>
        <p className={styles.adminEyebrow}>Редактирование</p>
        <div>
          <h1>{title.name}</h1>
        </div>
      </header>

      <EditTitleForm
        action={updateAction}
        initialValues={{
          name: title.name,
          description: title.description ?? "",
          coverKey: title.coverKey ?? "",
          published: title.published,
        }}
      />

      <AddEpisodeForm action={addEpisodeAction} />

      <div className={styles.adminPanel}>
        <div className={styles.panelHeader}>
          <h2>Серии ({title.episodes.length})</h2>
          <p>Новые серии появятся в списке после сохранения.</p>
        </div>

        {title.episodes.length === 0 ? (
          <p className={styles.adminEmpty}>Серий пока нет.</p>
        ) : (
          <ul className={styles.adminEpisodeList}>
            {title.episodes
              .slice()
              .sort((a, b) => a.number - b.number)
              .map((episode) => (
                <li key={episode.id}>
                  <article className={styles.adminCard}>
                    <header className={styles.adminCardHeader}>
                      <strong className={styles.adminEpisodeTitle}>
                        {episode.number}. {episode.name}
                      </strong>
                      <span
                        className={`${styles.adminBadge} ${
                          episode.published
                            ? styles.adminBadgePublished
                            : styles.adminBadgeDraft
                        }`}
                      >
                        {episode.published ? "Опубликована" : "Черновик"}
                      </span>
                    </header>
                    {episode.durationMinutes ? (
                      <p className={styles.adminMeta}>
                        Длительность: {episode.durationMinutes} мин
                      </p>
                    ) : null}
                    <p className={styles.adminMeta}>
                      Плеер:{" "}
                      {episode.playerSrc ? (
                        <a
                          className={styles.adminLink}
                          href={episode.playerSrc}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {episode.playerSrc}
                        </a>
                      ) : (
                        "не указан"
                      )}
                    </p>
                  </article>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
