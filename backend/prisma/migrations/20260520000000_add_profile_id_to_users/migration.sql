-- AlterTable: add auto-increment profile_id to users
CREATE SEQUENCE IF NOT EXISTS users_profile_id_seq;

ALTER TABLE "users" ADD COLUMN "profile_id" INTEGER NOT NULL DEFAULT nextval('users_profile_id_seq');

-- Assign sequential values to existing rows (ordered by created_at for stable ordering)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM "users"
)
UPDATE "users"
SET "profile_id" = numbered.rn
FROM numbered
WHERE "users".id = numbered.id;

-- Set sequence to continue after existing max
SELECT setval('users_profile_id_seq', COALESCE((SELECT MAX(profile_id) FROM "users"), 0) + 1, false);

-- Make owned by the column so it drops with the column
ALTER SEQUENCE users_profile_id_seq OWNED BY "users"."profile_id";

-- Add unique constraint
CREATE UNIQUE INDEX "users_profile_id_key" ON "users"("profile_id");
