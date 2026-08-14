CREATE TABLE "episode_credits" (
    "id"             TEXT NOT NULL,
    "episode_id"     TEXT NOT NULL,
    "team_member_id" TEXT,
    "name"           TEXT,
    "role"           TEXT NOT NULL,
    "position"       INTEGER NOT NULL DEFAULT 0,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episode_credits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "episode_credits_episode_id_idx" ON "episode_credits"("episode_id");

CREATE INDEX "episode_credits_team_member_id_idx" ON "episode_credits"("team_member_id");

ALTER TABLE "episode_credits"
    ADD CONSTRAINT "episode_credits_episode_id_fkey"
    FOREIGN KEY ("episode_id") REFERENCES "episodes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "episode_credits"
    ADD CONSTRAINT "episode_credits_team_member_id_fkey"
    FOREIGN KEY ("team_member_id") REFERENCES "team_members"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
