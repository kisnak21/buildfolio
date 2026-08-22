export const runtime = 'nodejs'
export const maxDuration = 30

import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import logger from '@/lib/logger'

const MAINTENANCE_BATCH_SIZE = 5_000
const MAX_BATCHES_PER_RUN = 4

const drainBatches = async (runBatch: () => Promise<number>) => {
  let count = 0
  for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch += 1) {
    const batchCount = await runBatch()
    count += batchCount
    if (batchCount < MAINTENANCE_BATCH_SIZE) {
      return { count, hasMore: false }
    }
  }
  return { count, hasMore: true }
}

const retentionDays = (name: string, fallback: number) => {
  const value = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(value) ? Math.min(Math.max(value, 30), 3_650) : fallback
}

const authorized = (req: NextRequest) => {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || !authorization) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(authorization)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const now = new Date()
  const auditDays = retentionDays('AUDIT_RETENTION_DAYS', 365)
  const flagDays = retentionDays('RESOLVED_FLAG_RETENTION_DAYS', 90)
  const auditCutoff = new Date(now.getTime() - auditDays * 24 * 60 * 60 * 1_000)
  const flagCutoff = new Date(now.getTime() - flagDays * 24 * 60 * 60 * 1_000)

  try {
    const operationNames = ['auditLogs', 'contentFlags', 'suspensions'] as const
    const operations = await Promise.allSettled([
      drainBatches(() => prisma.$executeRaw`
          WITH doomed AS (
            SELECT "id" FROM "audit_logs"
            WHERE "created_at" < ${auditCutoff}
            ORDER BY "created_at"
            LIMIT ${MAINTENANCE_BATCH_SIZE}
          )
          DELETE FROM "audit_logs" AS logs
          USING doomed
          WHERE logs."id" = doomed."id"
        `),
      drainBatches(() => prisma.$executeRaw`
          WITH doomed AS (
            SELECT "id" FROM "content_flags"
            WHERE "status" IN ('resolved', 'dismissed')
              AND "resolved_at" < ${flagCutoff}
            ORDER BY "resolved_at"
            LIMIT ${MAINTENANCE_BATCH_SIZE}
          )
          DELETE FROM "content_flags" AS flags
          USING doomed
          WHERE flags."id" = doomed."id"
        `),
      drainBatches(() => prisma.$executeRaw`
          WITH expired AS (
            SELECT "id" FROM "users"
            WHERE "banned_at" IS NULL
              AND "suspended_until" <= ${now}
            ORDER BY "suspended_until"
            LIMIT ${MAINTENANCE_BATCH_SIZE}
          )
          UPDATE "users" AS users
          SET "suspended_until" = NULL,
              "moderation_reason" = NULL,
              "moderated_by_id" = NULL
          FROM expired
          WHERE users."id" = expired."id"
        `),
    ])

    const results = operations.map((operation) =>
      operation.status === 'fulfilled' ? operation.value : null,
    )

    const result = {
      auditLogsDeleted: results[0]?.count ?? null,
      contentFlagsDeleted: results[1]?.count ?? null,
      suspensionsExpired: results[2]?.count ?? null,
      auditRetentionDays: auditDays,
      resolvedFlagRetentionDays: flagDays,
      batchSize: MAINTENANCE_BATCH_SIZE,
      maxBatches: MAX_BATCHES_PER_RUN,
      hasMore: results.some((operation) => operation?.hasMore === true),
    }
    const failedOperations = operations.flatMap((operation, index) =>
      operation.status === 'rejected'
        ? [
            {
              name: operationNames[index],
              error:
                operation.reason instanceof Error
                  ? operation.reason.message
                  : 'Unknown error',
            },
          ]
        : [],
    )
    if (failedOperations.length > 0) {
      logger.error(
        { failedOperations, result },
        'Scheduled maintenance partially failed',
      )
      return NextResponse.json(
        { success: false, message: 'Maintenance partially failed', data: result },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (result.hasMore) {
      logger.warn(result, 'Scheduled maintenance backlog remains')
      return NextResponse.json(
        { success: false, message: 'Maintenance backlog remains', data: result },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    logger.info(result, 'Scheduled maintenance completed')
    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    logger.error({ err: error }, 'Scheduled maintenance failed')
    return NextResponse.json(
      { success: false, message: 'Maintenance failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
