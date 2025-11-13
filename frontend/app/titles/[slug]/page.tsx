/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
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
import { buildMediaUrl } from "@/lib/media";
import { detectGenres } from "@/lib/genres";
import { detectTags, detectAgeRating } from "@/lib/catalog-keywords";
import { getReleaseDate, sortTitlesByReleaseDateDesc } from "@/lib/title-utils";
import { TitleDescriptionExpander } from "./title-description";
import { FavoriteToggle } from "./favorite-toggle";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

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

  const publishedEpisodes = title.episodes.filter(
    (episode) => episode.published
  );
  const playableEpisodes = title.episodes.filter(
    (episode) => episode.playerSrc
  );
  const completed =
    title.published &&
    publishedEpisodes.length > 0 &&
    publishedEpisodes.length === title.episodes.length;
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
  const titleTags =
    title.tags && title.tags.length > 0
      ? title.tags
      : detectTags(title.description);
  const titleAgeRating = title.ageRating ?? detectAgeRating(title.description);
  const formatGenre = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const formatTag = (value: string) => `#${formatGenre(value)}`;
  const releaseDate = getReleaseDate(title);
  const descriptionText = title.description?.trim() ?? "";
  const hasDescription = Boolean(descriptionText);

  return (
    <article className="title-page">
      <Link className="title-page-back" href="/">
        ← Назад к каталогу
      </Link>
      <header className="title-hero">
        <div className="title-cover">
          {title.coverKey ? (
            <img
              src={buildMediaUrl("covers", title.coverKey)!}
              alt={`Обложка ${title.name}`}
              width={320}
              height={440}
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
              {completed ? "Завершен" : "Онгоинг"}
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
            {titleGenres.length > 0 ? (
              <ul className="title-genres-list" role="list">
                {titleGenres.map((genre) => (
                  <li key={genre}>
                    <span className="title-genre">{formatGenre(genre)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              ""
            )}
          </div>
          <div className="title-tags">
            {titleTags.length > 0 ? (
              <ul className="title-genres-list" role="list">
                {titleTags.map((tag) => (
                  <li key={tag}>
                    <span className="title-genre">{formatTag(tag)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              ""
            )}
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

      <EpisodePlayer episodes={title.episodes} />

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
                <CommentBlock comment={comment} />
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
          <p className="latest-eyebrow">Новинки</p>
          <h2 className="latest-title">Последние релизы</h2>
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
  );
}

function CommentBlock({ comment }: { comment: Comment }) {
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
      </header>
      <p className="comment-card-body">{comment.body}</p>
    </article>
  );
}
