export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireActiveUser } from '@/lib/middleware/authMiddleware'
import { AI_QUOTAS, isDistributedRateLimitConfigured, rateLimitStatus } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { user, error } = await requireActiveUser(req)
  if (error || !user) return error ?? NextResponse.json({ success: false }, { status: 401 })

  if (process.env.NODE_ENV === 'production' && !isDistributedRateLimitConfigured) {
    return NextResponse.json(
      { success: false, message: 'AI generation is temporarily unavailable' },
      { status: 503 },
    )
  }

  const [hourly, daily] = await Promise.all([
    rateLimitStatus(AI_QUOTAS.hourly.key(user.id), AI_QUOTAS.hourly.config),
    rateLimitStatus(AI_QUOTAS.daily.key(user.id), AI_QUOTAS.daily.config),
  ])

  return NextResponse.json(
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
  )
}
