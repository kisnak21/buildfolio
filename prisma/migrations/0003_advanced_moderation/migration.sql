-- AlterTable
ALTER TABLE "users"
ADD COLUMN "banned_at" TIMESTAMPTZ(6),
ADD COLUMN "suspended_until" TIMESTAMPTZ(6),
ADD COLUMN "moderation_reason" VARCHAR(500),
ADD COLUMN "moderated_by_id" UUID;

-- AlterTable
ALTER TABLE "projects"
ADD COLUMN "hidden_at" TIMESTAMPTZ(6),
ADD COLUMN "hidden_reason" VARCHAR(500),
ADD COLUMN "hidden_by_id" UUID,
ADD COLUMN "featured_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "comments"
ADD COLUMN "hidden_at" TIMESTAMPTZ(6),
ADD COLUMN "hidden_reason" VARCHAR(500),
ADD COLUMN "hidden_by_id" UUID;

-- CreateIndex
CREATE INDEX "users_banned_at_idx" ON "users"("banned_at");
CREATE INDEX "users_suspended_until_idx" ON "users"("suspended_until");
CREATE INDEX "projects_hidden_at_idx" ON "projects"("hidden_at");
CREATE INDEX "projects_featured_at_idx" ON "projects"("featured_at");
CREATE INDEX "comments_hidden_at_idx" ON "comments"("hidden_at");
