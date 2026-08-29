CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "projects"
ADD COLUMN "status" "ProjectStatus" NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX "projects_user_id_status_idx"
ON "projects"("user_id", "status");
