DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnimeListStatus') THEN
    CREATE TYPE "AnimeListStatus" AS ENUM ('WATCHING', 'WATCHED', 'DROPPED', 'PLANNED');
  END IF;
END $$;

CREATE TABLE "anime_list_entries" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "title_id"   TEXT NOT NULL,
    "status"     "AnimeListStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anime_list_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "anime_list_entries_user_id_title_id_key"
    ON "anime_list_entries"("user_id", "title_id");

ALTER TABLE "anime_list_entries"
    ADD CONSTRAINT "anime_list_entries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "anime_list_entries"
    ADD CONSTRAINT "anime_list_entries_title_id_fkey"
    FOREIGN KEY ("title_id") REFERENCES "titles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
