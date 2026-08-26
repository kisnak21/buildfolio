export const runtime = 'nodejs'

import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireActiveUser } from '@/lib/middleware/authMiddleware'
import {
  AI_QUOTAS,
  isDistributedRateLimitConfigured,
  rateLimitStatus,
} from '@/lib/rateLimit'

const withRequestId = <T extends Response>(response: T, requestId: string) => {
  response.headers.set('X-Request-ID', requestId)
  return response
}

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  if (process.env.AI_GENERATION_ENABLED !== 'true') {
    return withRequestId(
      NextResponse.json(
        {
          success: false,
          message: 'AI generation is coming soon. No quota is consumed.',
        },
        { status: 503 },
      ),
      requestId,
    )
  }

  const { user, error } = await requireActiveUser(req)
  if (error || !user) {
    return withRequestId(
      error ?? NextResponse.json({ success: false }, { status: 401 }),
      requestId,
    )
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !isDistributedRateLimitConfigured
  ) {
    return withRequestId(
      NextResponse.json(
        { success: false, message: 'AI generation is temporarily unavailable' },
        { status: 503 },
      ),
      requestId,
    )
  }

  const [hourly, daily] = await Promise.all([
    rateLimitStatus(AI_QUOTAS.hourly.key(user.id), AI_QUOTAS.hourly.config),
    rateLimitStatus(AI_QUOTAS.daily.key(user.id), AI_QUOTAS.daily.config),
  ])

  return withRequestId(
    NextResponse.json(
      {
        success: true,
        data: {
          hourly: {
            remaining: hourly.remaining,
            limit: AI_QUOTAS.hourly.config.max,
            resetAt: new Date(Date.now() + hourly.resetInMs).toISOString(),
          },
          daily: {
            remaining: daily.remaining,
            limit: AI_QUOTAS.daily.config.max,
            resetAt: new Date(Date.now() + daily.resetInMs).toISOString(),
          },
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    ),
    requestId,
  )
}
