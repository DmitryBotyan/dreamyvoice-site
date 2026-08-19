import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsPost } from "@/lib/server-api";
import { buildMediaUrl } from "@/lib/media";
import { createBaseMetadata, createNewsJsonLd, getAbsoluteUrl } from "@/lib/seo";
import { CoverImage } from "../../cover-image";
import { NewsBody } from "../news-body";
import { formatNewsDate } from "../format-date";
import styles from "../news.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPost(slug);

  if (!post) {
    return { title: "Новость не найдена" };
  }

  return createBaseMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    url: getAbsoluteUrl(`/news/${post.slug}`),
    image: post.coverKey ? buildMediaUrl("covers", post.coverKey) ?? undefined : undefined,
    article: {
      publishedTime: post.publishedAt ?? post.createdAt,
      modifiedTime: post.updatedAt,
    },
    // Черновик доступен админу по прямой ссылке, но индексировать его не нужно.
    robots: post.published ? undefined : { index: false, follow: false },
  });
}

export default async function NewsPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getNewsPost(slug);

  if (!post) {
    notFound();
  }

  const coverUrl = post.coverKey ? buildMediaUrl("covers", post.coverKey) : null;
  const publishedDate = post.publishedAt ?? post.createdAt;

  // Разметку черновика поисковикам отдавать незачем.
  const newsJsonLd = post.published ? createNewsJsonLd(post) : null;

  return (
    <div className={styles.page}>
      {newsJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }}
        />
      ) : null}
      <article className={styles.article}>
        <Link href="/news" className={styles.back}>
          Назад к новостям
        </Link>

        <header className={styles.articleHeader}>
          <h1 className={styles.articleTitle}>{post.title}</h1>
          <div className={styles.articleMeta}>
            <time dateTime={new Date(publishedDate).toISOString()}>
              {formatNewsDate(publishedDate)}
            </time>
            {post.published ? null : (
              <span className={styles.cardDraft}>Черновик</span>
            )}
          </div>
        </header>

        {coverUrl ? (
          <div className={styles.articleCover}>
            <CoverImage
              src={coverUrl}
              alt={`Обложка новости «${post.title}»`}
              width={1280}
              height={720}
              blurHash={post.coverBlurHash}
              priority
            />
          </div>
        ) : null}

        {/* HTML уже очищен по allow-list на бэкенде при сохранении. */}
        <NewsBody className={styles.content} html={post.body} />
      </article>
    </div>
  );
}
