-- CreateTable
CREATE TABLE "content_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "details" VARCHAR(1000),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reporter_id" UUID,
    "reporter_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by_id" UUID,

    CONSTRAINT "content_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_flags_target_type_target_id_idx" ON "content_flags"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_flags_status_created_at_idx" ON "content_flags"("status", "created_at");

