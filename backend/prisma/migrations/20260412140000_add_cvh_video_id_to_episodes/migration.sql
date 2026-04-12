ALTER TABLE "episodes"
  ADD COLUMN IF NOT EXISTS "cvh_video_id" TEXT;

ALTER TABLE "episodes"
  ALTER COLUMN "player_src" DROP NOT NULL;
