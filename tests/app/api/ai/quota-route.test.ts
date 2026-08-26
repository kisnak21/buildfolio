import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  rateLimitStatus: vi.fn(),
}))

vi.mock('@/lib/middleware/authMiddleware', () => ({
  requireActiveUser: mocks.requireActiveUser,
}))

vi.mock('@/lib/rateLimit', () => ({
  AI_QUOTAS: {
    hourly: {
      key: (userId: string) => `hourly:${userId}`,
      config: { max: 5, windowMs: 3_600_000 },
    },
    daily: {
      key: (userId: string) => `daily:${userId}`,
      config: { max: 15, windowMs: 86_400_000 },
    },
  },
  isDistributedRateLimitConfigured: true,
  rateLimitStatus: mocks.rateLimitStatus,
}))

import { GET } from '@/app/api/ai/quota/route'

const request = () => new NextRequest('http://localhost:3001/api/ai/quota')

describe('AI quota route', () => {
  beforeEach(() => {
    vi.stubEnv('AI_GENERATION_ENABLED', 'false')
    mocks.requireActiveUser.mockReset()
    mocks.rateLimitStatus.mockReset()
  })

  afterEach(() => vi.unstubAllEnvs())

  it('returns Coming Soon without touching auth when disabled', async () => {
    const response = await GET(request())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(body.message).toMatch(/coming soon/i)
    expect(body.success).toBe(false)
    expect(mocks.requireActiveUser).not.toHaveBeenCalled()
  })

  it('returns authenticated quota when enabled', async () => {
    vi.stubEnv('AI_GENERATION_ENABLED', 'true')
    mocks.requireActiveUser.mockResolvedValue({
      user: { id: 'user-1' },
      error: null,
    })
    mocks.rateLimitStatus
      .mockResolvedValueOnce({
        success: true,
        remaining: 4,
        resetInMs: 60_000,
      })
      .mockResolvedValueOnce({
        success: true,
        remaining: 14,
        resetInMs: 120_000,
      })

    const response = await GET(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(body).toMatchObject({
      success: true,
      data: {
        hourly: { remaining: 4, limit: 5 },
        daily: { remaining: 14, limit: 15 },
      },
    })
  })
})
