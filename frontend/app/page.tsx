/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getTitles, getGenres, getTags } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { sortTitlesByReleaseDateDesc } from "@/lib/title-utils";
import { CatalogSection } from "./catalog-section";
import { enrichTitles } from "./catalog-filter-utils";

export default async function HomePage() {
  const [titles, genreOptions, tagOptions] = await Promise.all([
    getTitles(),
    getGenres(),
    getTags(),
  ]);
  const latestTitles = sortTitlesByReleaseDateDesc(titles).slice(0, 4);
  const enrichedTitles = enrichTitles(titles);

  const availableYears = Array.from(
    new Set(enrichedTitles.map((title) => title.releaseYear))
  ).sort((a, b) => b - a);

  return (
    <>
      <section className="latest-section">
        <div className="latest-heading">
          <p className="latest-eyebrow">Новинки</p>
          <h2 className="latest-title">Последние релизы</h2>
        </div>
        {latestTitles.length === 0 ? (
          <p className="latest-empty">
            Как только появятся новые релизы, они сразу отобразятся здесь.
          </p>
        ) : (
          <ul className="latest-grid" role="list">
            {latestTitles.map((title) => (
              <li key={title.id} className="latest-card">
                <Link
                  href={`/titles/${title.slug}`}
                  className="latest-card-link"
                  aria-label={`Открыть страницу тайтла ${title.name}`}
                >
                  <div
                    className={`latest-cover${
                      title.coverKey ? "" : " latest-cover--empty"
                    }`}
                  >
                    {title.coverKey ? (
                      <img
                        src={buildMediaUrl("covers", title.coverKey)!}
                        alt={`Обложка ${title.name}`}
                        width={180}
                        height={240}
                      />
                    ) : (
                      <span className="sr-only">Обложка отсутствует</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <h1 className="catalog-title">Каталог тайтлов</h1>
          <p className="catalog-subtitle">
            Подборка релизов команды DreamyVoice
          </p>
        </div>
        {titles.length === 0 ? (
          <p className="catalog-empty">
            Пока ничего нет. Добавьте первый тайтл через админку.
          </p>
        ) : (
          <CatalogSection
            titles={enrichedTitles}
            availableYears={availableYears}
            genreOptions={genreOptions}
            tagOptions={tagOptions}
          />
        )}
      </section>
    </>
  );
}
