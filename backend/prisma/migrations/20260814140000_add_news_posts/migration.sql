CREATE TABLE "news_posts" (
    "id"              TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "excerpt"         TEXT,
    "body"            TEXT NOT NULL,
    "cover_key"       TEXT,
    "cover_blur_hash" TEXT,
    "published"       BOOLEAN NOT NULL DEFAULT false,
    "published_at"    TIMESTAMP(3),
    "author_id"       TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "news_posts_slug_key" ON "news_posts"("slug");

CREATE INDEX "news_posts_published_published_at_idx"
    ON "news_posts"("published", "published_at");

ALTER TABLE "news_posts"
    ADD CONSTRAINT "news_posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
