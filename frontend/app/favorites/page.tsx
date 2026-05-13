import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, getFavoriteTitles } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { CoverImage } from "@/app/cover-image";
import { FavoritesLoginPrompt } from "./login-prompt";
import styles from "./page.module.css";
import { createBaseMetadata, getAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = createBaseMetadata({
  title: "Избранные тайтлы",
  description:
    "Ваша коллекция избранных аниме тайтлов. Быстрый доступ к любимым релизам команды DreamyVoice.",
  url: getAbsoluteUrl("/favorites"),
});

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return <FavoritesLoginPrompt />;
  }

  const favorites = await getFavoriteTitles();

  return (
    <section className={styles.favoritesPage}>
      <header className={styles.favoritesHeading}>
        <h1 className={styles.favoritesTitle}>Избранное</h1>
      </header>

      {favorites.length === 0 ? (
        <div className={styles.favoritesEmpty}>
          <p>Пока нет ни одного релиза. </p>
        </div>
      ) : (
        <ul className={`catalog-grid ${styles.favoritesGrid}`} role="list">
          {favorites.map((title) => {
            const coverUrl = title.coverKey
              ? buildMediaUrl("covers", title.coverKey)
              : null;
            return (
              <li key={title.id} className="catalog-card">
                <Link
                  href={`/titles/${title.slug}`}
                  className="catalog-card-body"
                  aria-label={`Открыть страницу тайтла ${title.name}`}
                >
                  {coverUrl ? (
                    <div className="catalog-card-cover">
                      <CoverImage
                        src={coverUrl}
                        alt={`Обложка ${title.name}`}
                        width={240}
                        height={320}
                        blurHash={title.coverBlurHash}
                      />
                    </div>
                  ) : (
                    <div className="catalog-card-cover catalog-card-cover--empty">
                      <span>Нет обложки</span>
                    </div>
                  )}
                  <h2 className="catalog-card-title" title={title.name}>
                    {title.name}
                  </h2>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
