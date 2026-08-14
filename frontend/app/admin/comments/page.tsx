import Link from "next/link";
import { getAllComments } from "@/lib/server-api";
import { DeleteLink } from "../delete-link";
import { deleteCommentAction } from "./actions";
import styles from "../styles.module.css";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow",
});

export default async function AdminCommentsPage() {
  const comments = await getAllComments();

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Комментарии</h1>
        <span className={styles.pageCount}>{comments.length}</span>
      </header>

      <section className={styles.section}>
        {comments.length === 0 ? (
          <p className={styles.empty}>Комментариев пока нет.</p>
        ) : (
          <ul className={styles.rowList} role="list">
            {comments.map((comment) => (
              <li key={comment.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>
                    {comment.author.username}
                    {comment.isReply ? (
                      <span className={styles.rowMeta}>ответ</span>
                    ) : null}
                  </p>
                  <p className={styles.rowMeta}>
                    <Link className={styles.link} href={`/titles/${comment.title.slug}`}>
                      {comment.title.name}
                    </Link>{" "}
                    · {dateFormatter.format(new Date(comment.createdAt))}
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
