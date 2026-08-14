import Link from "next/link";
import {
  getAllComments,
  getNewsPosts,
  getTeamMembers,
  getTitles,
} from "@/lib/server-api";
import { DeleteLink } from "./delete-link";
import { deleteCommentAction } from "./comments/actions";
import styles from "./styles.module.css";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

export default async function AdminOverviewPage() {
  const [titles, newsPosts, teamMembers, comments] = await Promise.all([
    getTitles({ includeDrafts: true }),
    getNewsPosts({ includeDrafts: true }),
    getTeamMembers(),
    getAllComments(6),
  ]);

  const episodeCount = titles.reduce(
    (sum, title) => sum + title.episodes.length,
    0
  );
  const draftTitles = titles.filter((title) => !title.published).length;
  const draftNews = newsPosts.filter((post) => !post.published).length;

  const summary = [
    {
      label: draftTitles > 0 ? `тайтлов · ${draftTitles} черновик.` : "тайтлов",
      value: titles.length,
      href: "/admin/titles",
    },
    { label: "серий", value: episodeCount, href: "/admin/titles" },
    {
      label: draftNews > 0 ? `новостей · ${draftNews} черновик.` : "новостей",
      value: newsPosts.length,
      href: "/admin/news",
    },
    { label: "в команде", value: teamMembers.length, href: "/admin/team" },
  ];

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Обзор</h1>
      </header>

      <ul className={styles.summary} role="list">
        {summary.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className={styles.summaryItem}>
              <span className={styles.summaryValue}>{item.value}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Последние комментарии</h2>
          <Link className={styles.link} href="/admin/comments">
            Все
          </Link>
        </div>

        {comments.length === 0 ? (
          <p className={styles.empty}>Комментариев пока нет.</p>
        ) : (
          <ul className={styles.rowList} role="list">
            {comments.map((comment) => (
              <li key={comment.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>{comment.author.username}</p>
                  <p className={styles.rowMeta}>
                    {comment.title.name} ·{" "}
                    {dateFormatter.format(new Date(comment.createdAt))}
                  </p>
                  <p className={styles.rowBody}>{comment.body}</p>
                </div>
                <div className={styles.rowActions}>
                  <DeleteLink
                    action={deleteCommentAction}
                    fields={[
                      { name: "commentId", value: comment.id },
                      { name: "titleSlug", value: comment.title.slug },
                    ]}
                    formClassName={styles.deleteLinkForm}
                    className={styles.linkDanger}
                  >
                    Удалить
                  </DeleteLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
