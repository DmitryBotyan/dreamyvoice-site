/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, getNewsPosts } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { createBaseMetadata, getAbsoluteUrl } from "@/lib/seo";
import { formatNewsDate } from "./format-date";
import styles from "./news.module.css";

export const metadata: Metadata = createBaseMetadata({
  title: "Новости DreamyVoice",
  description:
    "Новости команды DreamyVoice: анонсы релизов, обновления сайта и всё, что происходит вокруг наших озвучек.",
  url: getAbsoluteUrl("/news"),
});

export default async function NewsPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  // Админам показываем и черновики — так удобнее проверять новость перед выходом.
  const posts = await getNewsPosts({ includeDrafts: isAdmin });

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Что нового у команды</h1>
        <p className={styles.heroText}>
          Анонсы релизов, обновления плеера и сайта, а также всё, чем команда
          хочет поделиться между сериями.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className={styles.empty}>
          Новостей пока нет — заглядывайте позже.
        </p>
      ) : (
        <ul className={styles.grid} role="list">
          {posts.map((post) => {
            const coverUrl = post.coverKey
              ? buildMediaUrl("covers", post.coverKey)
              : null;

            return (
              <li key={post.id} className={styles.card}>
                <Link href={`/news/${post.slug}`} className={styles.cardLink}>
                  <div
                    className={`${styles.cardCover}${
                      coverUrl ? "" : ` ${styles.cardCoverEmpty}`
                    }`}
                  >
                    {coverUrl ? (
                      <img src={coverUrl} alt={`Обложка новости «${post.title}»`} />
                    ) : (
                      <span>DreamyVoice</span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    {post.published ? null : (
                      <span className={styles.cardDraft}>Черновик</span>
                    )}
                    <span className={styles.cardDate}>
                      {formatNewsDate(post.publishedAt ?? post.createdAt)}
                    </span>
                    <h2 className={styles.cardTitle}>{post.title}</h2>
                    {post.excerpt ? (
                      <p className={styles.cardExcerpt}>{post.excerpt}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
