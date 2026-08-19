import type { Metadata } from "next";
import Link from "next/link";
import { getTitles, getGenres, getTags } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { sortTitlesByReleaseDateDesc } from "@/lib/title-utils";
import { CATALOG_ANCHOR_ID, CatalogSection } from "./catalog-section";
import {
  enrichTitles,
  parsePageParam,
  type HomePageSearchParams,
} from "./catalog-filter-utils";
import {
  SITE_DESCRIPTION,
  SITE_TITLE,
  createBaseMetadata,
  getAbsoluteUrl,
} from "@/lib/seo";
import { NewEpisodeBadge } from "./new-episode-badge";
import { isOngoingTitle } from "@/lib/title-status";
import { CoverImage } from "./cover-image";

const BASE_DESCRIPTION = SITE_DESCRIPTION;

type Props = {
  searchParams?: Promise<HomePageSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const page = parsePageParam(params.page);
  const isFirstPage = page <= 1;

  return createBaseMetadata({
    title: isFirstPage ? SITE_TITLE : `${SITE_TITLE}, страница ${page}`,
    titleAbsolute: true,
    description: BASE_DESCRIPTION,
    // Канонический URL страниц каталога с номером страницы, чтобы не плодить дубли.
    url: getAbsoluteUrl(isFirstPage ? "/" : `/?page=${page}`),
  });
}

export default async function HomePage() {
  const [titles, genreOptions, tagOptions] = await Promise.all([
    getTitles(),
    getGenres(),
    getTags(),
  ]);
  const latestTitles = sortTitlesByReleaseDateDesc(titles).slice(0, 4);
  const enrichedTitles = enrichTitles(titles);

  return (
    <>
      <section className="latest-section">
        <div className="latest-heading">
          <h2 className="latest-title">Новинки</h2>
        </div>
        {latestTitles.length === 0 ? (
          <p className="latest-empty">
            Как только появятся новые релизы, они сразу отобразятся здесь.
          </p>
        ) : (
          <ul className="latest-grid" role="list">
            {latestTitles.map((title, index) => (
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
                      <CoverImage
                        src={buildMediaUrl("covers", title.coverKey)!}
                        alt={`Обложка ${title.name}`}
                        width={180}
                        height={240}
                        blurHash={title.coverBlurHash}
                        priority={index < 4}
                      />
                    ) : (
                      <span className="sr-only">Обложка отсутствует</span>
                    )}
                    <NewEpisodeBadge
                      slug={title.slug}
                      episodeCount={title.episodes.filter((e) => e.published).length}
                      isOngoing={isOngoingTitle(title)}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="catalog-section" id={CATALOG_ANCHOR_ID}>
        {titles.length === 0 ? (
          <p className="catalog-empty">
            Пока ничего нет. Добавьте первый тайтл через админку.
          </p>
        ) : (
          <CatalogSection
            titles={enrichedTitles}
            genreOptions={genreOptions}
            tagOptions={tagOptions}
          />
        )}
      </section>
    </>
  );
}
