import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamMembers, getTitle } from "@/lib/server-api";
import { groupCreditsByRole } from "@/lib/episode-credits";
import { EditTitleForm } from "./edit-title-form";
import { AddEpisodeForm } from "./add-episode-form";
import { EditEpisodeForm } from "./edit-episode-form";
import { DeleteLink } from "../../delete-link";
import {
  createEpisodeAction,
  updateEpisodeAction,
  updateTitleAction,
  deleteEpisodeAction,
} from "./actions";
import styles from "../../styles.module.css";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminTitlePage({ params }: Props) {
  const { slug } = await params;
  const title = await getTitle(slug);

  if (!title) {
    notFound();
  }

  const updateAction = updateTitleAction.bind(null, slug);
  const addEpisodeAction = createEpisodeAction.bind(null, slug);
  const teamMembers = await getTeamMembers();

  return (
    <>
      <p className={styles.breadcrumb}>
        <Link href="/admin/titles">Назад к тайтлам</Link>
      </p>
      <header className={styles.pageHeader}>
        <h1>{title.name}</h1>
        <p>
          {title.published ? "Опубликован" : "Черновик"} · {title.slug}
        </p>
      </header>

      <EditTitleForm
        action={updateAction}
        initialValues={{
          name: title.name,
          description: title.description ?? "",
          coverKey: title.coverKey ?? "",
          coverBlurHash: title.coverBlurHash ?? "",
          published: title.published,
          genres: title.genres,
          tags: title.tags,
          ageRating: title.ageRating ?? null,
          originalReleaseDate: title.originalReleaseDate ?? null,
          cvhAggregator: title.cvhAggregator ?? null,
        }}
      />

      <AddEpisodeForm action={addEpisodeAction} teamMembers={teamMembers} />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Серии</h2>
          <span className={styles.sectionCount}>{title.episodes.length}</span>
        </div>

        {title.episodes.length === 0 ? (
          <p className={styles.empty}>Серий пока нет.</p>
        ) : (
          <ul className={styles.rowList} role="list">
            {title.episodes
              .slice()
              .sort((a, b) => a.number - b.number)
              .map((episode) => {
                const creditGroups = groupCreditsByRole(episode.credits);

                return (
                  <li key={episode.id} className={styles.rowStacked}>
                    <div className={styles.row}>
                      <div className={styles.rowMain}>
                        <p className={styles.rowTitle}>
                          Серия {episode.number}
                          {episode.published ? null : (
                            <span className={styles.badgeDraft}>Черновик</span>
                          )}
                        </p>
                        <p className={styles.rowMeta}>
                          {episode.durationMinutes
                            ? `${episode.durationMinutes} мин · `
                            : ""}
                          {episode.playerSrc ? (
                            <a
                              className={styles.link}
                              href={episode.playerSrc}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {episode.playerSrc}
                            </a>
                          ) : episode.cvhVideoId ? (
                            <span>CDNVideoHub ID: {episode.cvhVideoId}</span>
                          ) : (
                            "плеер не указан"
                          )}
                        </p>
                        {creditGroups.length > 0 ? (
                          <p className={styles.rowMeta}>
                            {creditGroups
                              .map(
                                (group) =>
                                  `${group.role} — ${group.credits
                                    .map((credit) => credit.name)
                                    .join(", ")}`
                              )
                              .join("; ")}
                          </p>
                        ) : null}
                      </div>
                      <div className={styles.rowActions}>
                        <DeleteLink
                          action={deleteEpisodeAction.bind(null, title.slug)}
                          fields={[{ name: "episodeId", value: episode.id }]}
                          formClassName={styles.deleteLinkForm}
                          className={styles.linkDanger}
                        >
                          Удалить
                        </DeleteLink>
                      </div>
                    </div>
                    <EditEpisodeForm
                      episode={episode}
                      action={updateEpisodeAction.bind(null, title.slug, episode.id)}
                      teamMembers={teamMembers}
                    />
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </>
  );
}
