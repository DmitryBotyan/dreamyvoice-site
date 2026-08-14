import Link from "next/link";
import { getTitles } from "@/lib/server-api";
import { CreateTitleForm } from "../create-title-form";
import { DeleteLink } from "../delete-link";
import { deleteTitleAction } from "../actions";
import styles from "../styles.module.css";

export default async function AdminTitlesPage() {
  const titles = await getTitles({ includeDrafts: true });

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>Тайтлы</h1>
        <span className={styles.pageCount}>{titles.length}</span>
      </header>

      <CreateTitleForm />

      <section className={styles.section}>
        {titles.length === 0 ? (
          <p className={styles.empty}>Здесь появятся первые релизы после создания.</p>
        ) : (
          <ul className={styles.rowList} role="list">
            {titles.map((title) => (
              <li key={title.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>
                    <Link
                      className={styles.rowTitleLink}
                      href={`/admin/titles/${title.slug}`}
                    >
                      {title.name}
                    </Link>
                    {title.published ? null : (
                      <span className={styles.badgeDraft}>Черновик</span>
                    )}
                  </p>
                  <p className={styles.rowMeta}>
                    {title.slug} · {title.episodes.length} сер.
                  </p>
                </div>
                <div className={styles.rowActions}>
                  <DeleteLink
                    action={deleteTitleAction}
                    fields={[{ name: "slug", value: title.slug }]}
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
