import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(() => null),
  requireActiveUser: vi.fn(),
  rateLimit: vi.fn(),
  rateLimitStatus: vi.fn(),
  generateWithProviders: vi.fn(),
  parseAiRequest: vi.fn(),
}))

vi.mock('@/lib/middleware/authMiddleware', () => ({
  assertSameOrigin: mocks.assertSameOrigin,
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
  rateLimit: mocks.rateLimit,
  rateLimitStatus: mocks.rateLimitStatus,
}))

vi.mock('@/lib/services/aiService', () => ({
  generateWithProviders: mocks.generateWithProviders,
  parseAiRequest: mocks.parseAiRequest,
  streamIdeasWithProviders: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn() },
}))

import { POST } from '@/app/api/ai/generate/route'

const request = () =>
  new NextRequest('http://localhost:3001/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: 'description', input: { title: 'Test' } }),
  })

describe('AI generation route', () => {
  beforeEach(() => {
    mocks.assertSameOrigin.mockClear()
    mocks.requireActiveUser.mockReset()
    mocks.rateLimit.mockReset()
    mocks.rateLimitStatus.mockReset()
    mocks.generateWithProviders.mockReset()
    mocks.parseAiRequest.mockReset()
  })

  it('runs authenticated generation and consumes quota', async () => {
    mocks.requireActiveUser.mockResolvedValue({
      user: { id: 'user-1' },
      error: null,
    })
    mocks.rateLimitStatus.mockResolvedValue({
      success: true,
      remaining: 10,
      resetInMs: 60_000,
    })
    mocks.rateLimit.mockResolvedValue({
      success: true,
      remaining: 9,
      resetInMs: 60_000,
    })
    mocks.parseAiRequest.mockReturnValue({
      task: 'description',
      model: 'openai/gpt-oss-120b',
      input: { title: 'Test' },
    })
    mocks.generateWithProviders.mockResolvedValue({
      task: 'description',
      text: 'Generated description.',
      model: 'openai/gpt-oss-120b',
    })

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/)
    expect(response.headers.get('X-RateLimit-Remaining-Hour')).toBe('9')
    expect(body).toMatchObject({
      success: true,
      data: {
        task: 'description',
        model: 'openai/gpt-oss-120b',
      },
    })
    expect(mocks.generateWithProviders).toHaveBeenCalledOnce()
    expect(mocks.rateLimit).toHaveBeenCalledTimes(5)
  })
})
