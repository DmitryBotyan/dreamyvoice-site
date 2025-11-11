import Link from "next/link";
import { getCurrentUser, getFavoriteTitles } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { FavoritesLoginPrompt } from "./login-prompt";

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return <FavoritesLoginPrompt />;
  }

  const favorites = await getFavoriteTitles();

  return (
    <section className="favorites-page">
      <header className="favorites-heading">
        <div>
          <h1 className="favorites-title">Ваши избранные</h1>
        </div>
        <p className="favorites-subtitle">
          Здесь хранятся тайтлы, которые вы отметили звёздочкой.
        </p>
      </header>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <p>Пока нет ни одного релиза. </p>
        </div>
      ) : (
        <ul className="catalog-grid favorites-grid" role="list">
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
                      <img
                        src={coverUrl}
                        alt={`Обложка ${title.name}`}
                        width={240}
                        height={320}
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
