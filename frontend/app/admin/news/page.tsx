import Link from "next/link";
import { getNewsPosts } from "@/lib/server-api";
import { DeleteLink } from "../delete-link";
import { NewsForm } from "./news-form";
import { createNewsPostAction, deleteNewsPostAction } from "./actions";
import styles from "../styles.module.css";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function AdminNewsPage() {
  const posts = await getNewsPosts({ includeDrafts: true });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Новости</h1>
        <span className={styles.pageCount}>{posts.length}</span>
      </header>

      <NewsForm
        action={createNewsPostAction}
        legend="Новая новость"
        submitLabel="Создать новость"
        successMessage="Новость создана."
        clearOnSuccess
      />

      <section className={styles.section}>
        {posts.length === 0 ? (
          <p className={styles.empty}>Новостей пока нет.</p>
        ) : (
          <ul className={styles.rowList} role="list">
            {posts.map((post) => (
              <li key={post.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>
                    <Link
                      className={styles.rowTitleLink}
                      href={`/admin/news/${post.slug}`}
                    >
                      {post.title}
                    </Link>
                    {post.published ? null : (
                      <span className={styles.badgeDraft}>Черновик</span>
                    )}
                  </p>
                  <p className={styles.rowMeta}>
                    {dateFormatter.format(
                      new Date(post.publishedAt ?? post.createdAt)
                    )}
                  </p>
                </div>
                <div className={styles.rowActions}>
                  <DeleteLink
                    action={deleteNewsPostAction}
                    fields={[{ name: "slug", value: post.slug }]}
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
