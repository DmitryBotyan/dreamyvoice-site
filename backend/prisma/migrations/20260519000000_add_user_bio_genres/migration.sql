ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "favorite_genres" TEXT[] NOT NULL DEFAULT '{}';
