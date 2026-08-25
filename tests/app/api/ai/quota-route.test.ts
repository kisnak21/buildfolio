import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  rateLimitStatus: vi.fn(),
  distributed: true,
}))

vi.mock('@/lib/middleware/authMiddleware', () => ({
  requireActiveUser: mocks.requireActiveUser,
}))

vi.mock('@/lib/rateLimit', () => ({
  get isDistributedRateLimitConfigured() {
    return mocks.distributed
  },
  rateLimitStatus: mocks.rateLimitStatus,
  AI_QUOTAS: {
    hourly: {
      key: (userId: string) => `ai-success-hour-v2:${userId}`,
      config: { max: 5, windowMs: 3_600_000 },
    },
    daily: {
      key: (userId: string) => `ai-success-day-v2:${userId}`,
      config: { max: 15, windowMs: 86_400_000 },
    },
  },
}))

import { GET } from '@/app/api/ai/quota/route'

const quotaRequest = () => new NextRequest('http://localhost:3001/api/ai/quota')

describe('AI quota endpoint', () => {
  beforeEach(() => {
    mocks.requireActiveUser.mockReset()
    mocks.rateLimitStatus.mockReset()
    mocks.distributed = true
    mocks.requireActiveUser.mockResolvedValue({
      user: { id: 'user-1' },
      error: null,
    })
    mocks.rateLimitStatus.mockImplementation(async (_key, config) => ({
      success: true,
      remaining: config.max - 1,
      resetInMs: config.windowMs,
    }))
  })

  it('returns hourly and daily remaining counts with reset timestamps', async () => {
    const response = await GET(quotaRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(body).toEqual({
      success: true,
      data: {
        hourly: {
          remaining: 4,
          limit: 5,
          resetAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
        daily: {
          remaining: 14,
          limit: 15,
          resetAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      },
    })
    expect(mocks.rateLimitStatus).toHaveBeenCalledWith(
      'ai-success-hour-v2:user-1',
      { max: 5, windowMs: 3_600_000 },
    )
    expect(mocks.rateLimitStatus).toHaveBeenCalledWith(
      'ai-success-day-v2:user-1',
      { max: 15, windowMs: 86_400_000 },
    )
  })

  it('rejects unauthenticated requests', async () => {
    mocks.requireActiveUser.mockResolvedValue({
      user: null,
      error: NextResponse.json({ success: false }, { status: 401 }),
    })

    const response = await GET(quotaRequest())

    expect(response.status).toBe(401)
    expect(mocks.rateLimitStatus).not.toHaveBeenCalled()
  })

  it('is unavailable in production without a distributed limiter', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mocks.distributed = false

    try {
      const response = await GET(quotaRequest())
      expect(response.status).toBe(503)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
