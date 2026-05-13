/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  getCurrentUser,
  getTitle,
  getTitleComments,
  getTitles,
} from "@/lib/server-api";
import type { Comment } from "@/lib/types";
import { EpisodePlayer } from "./episode-player";
import { CommentForm } from "./comment-form";
import { CommentDeleteButton } from "./comment-delete-button";
import { buildMediaUrl } from "@/lib/media";
import { CoverImage } from "@/app/cover-image";
import { detectGenres } from "@/lib/genres";
import { detectTags, detectAgeRating } from "@/lib/catalog-keywords";
import { getReleaseDate, sortTitlesByReleaseDateDesc } from "@/lib/title-utils";
import { TitleDescriptionExpander } from "./title-description";
import { FavoriteToggle } from "./favorite-toggle";
import { StarRating } from "./star-rating";
import { EpisodeViewTracker } from "./episode-view-tracker";
import {
  TITLE_STATUS_LABELS,
  extractStatusFromTags,
  stripStatusTags,
} from "@/lib/title-status";
import { createTitleMetadata, createTitleJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitle(slug);

  if (!title) {
    return {
      title: "Тайтл не найден",
    };
  }

  return createTitleMetadata({
    name: title.name,
    description: title.description,
    coverKey: title.coverKey,
    slug: title.slug,
    episodes: title.episodes.map((ep) => ({
      number: ep.number,
      published: ep.published,
    })),
  });
}

export default async function TitlePage({ params }: Props) {
  const { slug } = await params;
  const [title, comments, currentUser, titles] = await Promise.all([
    getTitle(slug),
    getTitleComments(slug),
    getCurrentUser(),
    getTitles(),
  ]);

  if (!title) {
    notFound();
  }

  const latestTitles = sortTitlesByReleaseDateDesc(titles)
    .filter((item) => item.slug !== title.slug)
    .slice(0, 4);
  const explicitStatus = extractStatusFromTags(title.tags);

  const publishedEpisodes = title.episodes.filter(
    (episode) => episode.published
  );
  const playableEpisodes = title.episodes.filter(
    (episode) => episode.playerSrc
  );
  const derivedCompleted =
    title.published &&
    publishedEpisodes.length > 0 &&
    publishedEpisodes.length === title.episodes.length;
  const completed = explicitStatus
    ? explicitStatus === "completed"
    : derivedCompleted;
  const statusBadgeLabel = explicitStatus
    ? TITLE_STATUS_LABELS[explicitStatus]
    : derivedCompleted
    ? "Завершен"
    : "Онгоинг";
  const totalDurationMinutes = publishedEpisodes.reduce(
    (sum, episode) => sum + (episode.durationMinutes ?? 0),
    0
  );
  const durationLabel =
    totalDurationMinutes > 0
      ? (() => {
          const hours = Math.floor(totalDurationMinutes / 60);
          const minutes = totalDurationMinutes % 60;
          const parts = [];
          if (hours) {
            parts.push(`${hours} ч`);
          }
          if (minutes) {
            parts.push(`${minutes} мин`);
          }
          return parts.length > 0
            ? parts.join(" ")
            : `${totalDurationMinutes} мин`;
        })()
      : "-";
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  const titleGenres =
    title.genres && title.genres.length > 0
      ? title.genres
      : detectGenres(title.description);
  const titleTagsSource =
    title.tags && title.tags.length > 0
      ? title.tags
      : detectTags(title.description);
  const titleTags = stripStatusTags(titleTagsSource);
  const titleAgeRating = title.ageRating ?? detectAgeRating(title.description);
  const formatGenre = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const formatTag = (value: string) => `#${formatGenre(value)}`;
  const releaseDate = getReleaseDate(title);
  const descriptionText = title.description?.trim() ?? "";
  const hasDescription = Boolean(descriptionText);

  // Определяем жанры и теги для JSON-LD
  const titleGenresForJsonLd =
    title.genres && title.genres.length > 0
      ? title.genres
      : detectGenres(title.description);
  const titleTagsForJsonLd =
    title.tags && title.tags.length > 0
      ? title.tags
      : detectTags(title.description);

  const titleJsonLd = createTitleJsonLd({
    name: title.name,
    description: title.description,
    coverKey: title.coverKey,
    slug: title.slug,
    episodes: title.episodes.map((ep) => ({
      number: ep.number,
      published: ep.published,
    })),
    genres: titleGenresForJsonLd,
    tags: titleTagsForJsonLd,
  });

  return (
    <>
      <Script
        id="title-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(titleJsonLd),
        }}
      />
      <article className="title-page">
      <Link className="title-page-back" href="/">
        ← Назад к каталогу
      </Link>
      <header className="title-hero">
        <div className="title-cover">
          {title.coverKey ? (
            <CoverImage
              src={buildMediaUrl("covers", title.coverKey)!}
              alt={`Обложка ${title.name}`}
              width={320}
              height={440}
              blurHash={title.coverBlurHash}
            />
          ) : (
            <span>Обложка появится позже</span>
          )}
        </div>
        <div className="title-hero-content">
          <div className="title-badges">
            <span
              className={`title-badge ${
                completed ? "title-badge--success" : "title-badge--warning"
              }`}
            >
              {statusBadgeLabel}
            </span>
            {!title.published ? (
              <span className="title-badge">Черновик</span>
            ) : null}
            {titleAgeRating ? (
              <span className="title-badge title-badge--rating">
                {titleAgeRating}
              </span>
            ) : null}
          </div>
          <div className="title-hero-heading">
            <h1 className="title-hero-name">
              <span>{title.name}</span>
              <FavoriteToggle slug={title.slug} />
            </h1>
          </div>
          {hasDescription ? (
            <TitleDescriptionExpander description={descriptionText} />
          ) : (
            <p className="title-hero-description title-hero-description--muted">
              Описание появится совсем скоро.
            </p>
          )}
          <div className="title-genres">
            {titleGenres.length > 0 && (
              <ul className="title-genres-list" role="list">
                {titleGenres.map((genre) => (
                  <li key={genre}>
                    <span className="title-genre">{formatGenre(genre)}</span>
                  </li>
                ))}
              </ul>
            )}
            {titleTags.length > 0 && (
              <ul className="title-genres-list" role="list">
                {titleTags.map((tag) => (
                  <li key={tag}>
                    <span className="title-genre">{formatTag(tag)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="title-rating-row">
            <StarRating
              slug={title.slug}
              initialAvgRating={title.avgRating ?? null}
              initialRatingCount={title.ratingCount ?? 0}
              initialMyRating={title.myRating ?? null}
              isAuthenticated={Boolean(currentUser)}
            />
          </div>
          <dl className="title-meta">
            <div>
              <dd>
                {title.episodes.length} серий
                {publishedEpisodes.length !== title.episodes.length
                  ? ` / ${publishedEpisodes.length} опубликовано`
                  : ""}
              </dd>
            </div>
            <div>
              <dd>{durationLabel}</dd>
            </div>
            <div>
              <dd>{formatDate(releaseDate.toISOString())}</dd>
            </div>
          </dl>
        </div>
      </header>

      <EpisodeViewTracker
        slug={title.slug}
        episodeCount={publishedEpisodes.length}
      />
      <EpisodePlayer episodes={title.episodes} cvhAggregator={title.cvhAggregator} />

      <section className="comments-section" id="comments">
        <div className="comments-heading">
          <div>
            <h2 className="comments-title">Комментарии</h2>
          </div>
          <p className="comments-count">
            {comments.length === 0 ? "Нет сообщений" : `${comments.length} шт.`}
          </p>
        </div>
        {comments.length === 0 ? (
          <p className="comments-empty">
            Комментариев пока нет - станьте первым, чтобы поделиться
            впечатлениями.
          </p>
        ) : (
          <ul className="comments-list" role="list">
            {comments.map((comment) => (
              <li key={comment.id} className="comments-list-item">
                <CommentBlock
                  comment={comment}
                  titleSlug={title.slug}
                  isAdmin={currentUser?.role === "ADMIN"}
                />
              </li>
            ))}
          </ul>
        )}

        <CommentForm
          titleSlug={title.slug}
          isAuthenticated={Boolean(currentUser)}
        />
      </section>

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
            {latestTitles.map((latestTitle) => (
              <li key={latestTitle.id} className="latest-card">
                <Link
                  href={`/titles/${latestTitle.slug}`}
                  className="latest-card-link"
                  aria-label={`Открыть страницу тайтла ${latestTitle.name}`}
                >
                  <div
                    className={`latest-cover${
                      latestTitle.coverKey ? "" : " latest-cover--empty"
                    }`}
                  >
                    {latestTitle.coverKey ? (
                      <img
                        src={buildMediaUrl("covers", latestTitle.coverKey)!}
                        alt={`Обложка ${latestTitle.name}`}
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
    </article>
    </>
  );
}

function CommentBlock({
  comment,
  titleSlug,
  isAdmin,
}: {
  comment: Comment;
  titleSlug: string;
  isAdmin: boolean;
}) {
  const avatarUrl = comment.author.avatarKey
    ? buildMediaUrl("avatars", comment.author.avatarKey)
    : null;
  const dateTime = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(comment.createdAt));
  const status =
    comment.status && comment.status !== "APPROVED"
      ? comment.status === "REJECTED"
        ? "Отклонен"
        : "На модерации"
      : null;

  return (
    <article className="comment-card">
      <header className="comment-card-header">
        <div className="comment-card-avatar" aria-hidden={!avatarUrl}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={comment.author.username}
              width={48}
              height={48}
            />
          ) : (
            <span>{comment.author.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="comment-card-author">
          <strong>{comment.author.username}</strong>
          <small>{dateTime}</small>
        </div>
        {status ? (
          <span
            className={`comment-card-status ${
              comment.status === "REJECTED"
                ? "comment-card-status--rejected"
                : "comment-card-status--pending"
            }`}
          >
            {status}
          </span>
        ) : null}
        {isAdmin ? (
          <CommentDeleteButton
            titleSlug={titleSlug}
            commentId={comment.id}
            authorName={comment.author.username}
          />
        ) : null}
      </header>
      <p className="comment-card-body">{comment.body}</p>
    </article>
  );
}
