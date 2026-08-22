-- A hidden project must never be promoted in public featured ordering.
ALTER TABLE "projects"
ADD CONSTRAINT "projects_hidden_not_featured_check"
CHECK ("hidden_at" IS NULL OR "featured_at" IS NULL);

-- Supports bounded retention cleanup for resolved reports.
CREATE INDEX "content_flags_status_resolved_at_idx"
ON "content_flags"("status", "resolved_at");
