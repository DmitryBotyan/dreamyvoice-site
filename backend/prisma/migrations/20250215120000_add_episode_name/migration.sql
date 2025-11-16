-- Reintroduce the episode name column for better metadata control.
ALTER TABLE "episodes"
ADD COLUMN "name" TEXT NOT NULL DEFAULT '';

-- New entries must always provide the name explicitly.
ALTER TABLE "episodes"
ALTER COLUMN "name" DROP DEFAULT;
