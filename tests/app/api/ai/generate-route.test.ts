import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  stream: vi.fn(),
  parse: vi.fn(),
  rateLimit: vi.fn(),
  rateLimitStatus: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('@/lib/middleware/authMiddleware', () => ({
  assertSameOrigin: vi.fn(() => null),
  requireActiveUser: vi.fn(async () => ({
    user: { id: 'user-1' },
    error: null,
  })),
}))

vi.mock('@/lib/rateLimit', () => ({
  isDistributedRateLimitConfigured: true,
  rateLimit: mocks.rateLimit,
  rateLimitStatus: mocks.rateLimitStatus,
}))

vi.mock('@/lib/services/aiService', () => ({
  parseAiRequest: mocks.parse,
  generateWithOpenRouter: mocks.generate,
  streamIdeasWithOpenRouter: mocks.stream,
}))

vi.mock('@/lib/logger', () => ({
  default: { info: mocks.info, warn: mocks.warn },
}))

import { POST } from '@/app/api/ai/generate/route'

const limitResult = { success: true, remaining: 4, resetInMs: 3_600_000 }

const request = (task: 'description' | 'ideas') =>
  new NextRequest('http://localhost:3001/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3001',
    },
    body: JSON.stringify({ task, input: { title: 'secret project input' } }),
  })

describe('AI generation route observability', () => {
  beforeEach(() => {
    mocks.generate.mockReset()
    mocks.stream.mockReset()
    mocks.parse.mockReset()
    mocks.rateLimit.mockReset().mockResolvedValue(limitResult)
    mocks.rateLimitStatus.mockReset().mockResolvedValue(limitResult)
    mocks.info.mockReset()
    mocks.warn.mockReset()
  })

  it('returns a request ID and logs metadata without request input', async () => {
    mocks.parse.mockReturnValue({
      task: 'description',
      model: 'stealth/ox-alpha',
      input: { title: 'secret project input' },
    })
    mocks.generate.mockImplementation(async ({ onTelemetry }) => {
      onTelemetry({
        event: 'attempt_started',
        model: 'stealth/ox-alpha',
        attempt: 1,
        totalAttempts: 1,
      })
      onTelemetry({
        event: 'first_token',
        model: 'stealth/ox-alpha',
        actualModel: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 200,
        latencyMs: 12,
      })
      onTelemetry({
        event: 'attempt_succeeded',
        model: 'stealth/ox-alpha',
        actualModel: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 200,
        latencyMs: 20,
        outputCharacters: 42,
      })
      return {
        task: 'description',
        text: 'Generated description',
        model: 'stealth/ox-alpha',
      }
    })

    const response = await POST(request('description'))
    const requestId = response.headers.get('X-Request-ID')

    expect(response.status).toBe(200)
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(
      mocks.info.mock.calls.some(([metadata, message]) =>
        message === 'AI generation completed' &&
        metadata.requestId === requestId &&
        typeof metadata.firstTokenMs === 'number' &&
        metadata.outputCharacters === 42,
      ),
    ).toBe(true)
    expect(JSON.stringify(mocks.info.mock.calls)).not.toContain(
      'secret project input',
    )
  })

  it('includes the server request ID in SSE metadata and terminal events', async () => {
    mocks.parse.mockReturnValue({
      task: 'ideas',
      model: 'stealth/ox-alpha',
      input: { interests: 'private interests' },
    })
    mocks.stream.mockImplementation(async function* ({ onTelemetry }) {
      onTelemetry({
        event: 'attempt_started',
        model: 'stealth/ox-alpha',
        attempt: 1,
        totalAttempts: 1,
      })
      yield {
        event: 'meta',
        data: { model: 'stealth/ox-alpha', attempt: 1, total: 1 },
      }
      onTelemetry({
        event: 'attempt_succeeded',
        model: 'stealth/ox-alpha',
        actualModel: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 200,
        latencyMs: 20,
        outputCharacters: 100,
      })
      yield {
        event: 'done',
        data: {
          data: {
            task: 'ideas',
            ideas: [],
            model: 'stealth/ox-alpha',
          },
        },
      }
    })

    const response = await POST(request('ideas'))
    const requestId = response.headers.get('X-Request-ID')
    const body = await response.text()

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(body).toContain(`"requestId":"${requestId}"`)
    expect(body).toContain('event: meta')
    expect(body).toContain('event: done')
    expect(body).not.toContain('private interests')
  })

  it('returns request IDs and terminal metadata for provider failures', async () => {
    mocks.parse.mockReturnValue({
      task: 'description',
      model: 'stealth/ox-alpha',
      input: { title: 'secret failed input' },
    })
    mocks.generate.mockImplementation(async ({ onTelemetry }) => {
      onTelemetry({
        event: 'attempt_failed',
        model: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 503,
        latencyMs: 20,
        errorClass: 'APIConnectionError',
      })
      throw Object.assign(new Error('AI provider is unavailable. Please try again.'), {
        statusCode: 502,
        providerStatus: 503,
        errorClass: 'APIConnectionError',
      })
    })

    const response = await POST(request('description'))
    const requestId = response.headers.get('X-Request-ID')

    expect(response.status).toBe(502)
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(
      mocks.warn.mock.calls.some(
        ([metadata, message]) =>
          message === 'AI generation failed' &&
          metadata.requestId === requestId &&
          metadata.errorClass === 'APIConnectionError' &&
          metadata.outcome === 'failed',
      ),
    ).toBe(true)
    expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain(
      'secret failed input',
    )
  })

  it('logs quota rejection and preserves the request ID', async () => {
    mocks.parse.mockReturnValue({
      task: 'description',
      model: 'stealth/ox-alpha',
      input: { title: 'Buildfolio' },
    })
    mocks.rateLimitStatus.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      resetInMs: 30_000,
    })

    const response = await POST(request('description'))
    const requestId = response.headers.get('X-Request-ID')

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('30')
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(mocks.generate).not.toHaveBeenCalled()
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId,
        outcome: 'rejected',
        reason: 'hourly_quota',
      }),
      'AI generation rejected',
    )
  })

  it('uses the successful fallback first token in terminal telemetry', async () => {
    const now = vi.spyOn(performance, 'now')
    let clock = 0
    now.mockImplementation(() => clock)
    mocks.parse.mockReturnValue({
      task: 'description',
      model: 'stealth/ox-alpha',
      input: { title: 'Buildfolio' },
    })
    mocks.generate.mockImplementation(async ({ onTelemetry }) => {
      onTelemetry({
        event: 'attempt_started',
        model: 'stealth/ox-alpha',
        attempt: 1,
        totalAttempts: 2,
      })
      clock = 10
      onTelemetry({
        event: 'first_token',
        model: 'stealth/ox-alpha',
        actualModel: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 200,
        latencyMs: 10,
      })
      clock = 15
      onTelemetry({
        event: 'attempt_failed',
        model: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 200,
        latencyMs: 15,
        errorClass: 'InvalidIdeasError',
      })
      onTelemetry({
        event: 'fallback',
        from: 'stealth/ox-alpha',
        next: 'dots-studio/dots-3-note-preview:free',
        attempt: 1,
      })
      onTelemetry({
        event: 'attempt_started',
        model: 'dots-studio/dots-3-note-preview:free',
        attempt: 2,
        totalAttempts: 2,
      })
      clock = 30
      onTelemetry({
        event: 'first_token',
        model: 'dots-studio/dots-3-note-preview:free',
        actualModel: 'dots-studio/dots-3-note-preview:free',
        attempt: 2,
        providerStatus: 200,
        latencyMs: 15,
      })
      clock = 40
      onTelemetry({
        event: 'attempt_succeeded',
        model: 'dots-studio/dots-3-note-preview:free',
        actualModel: 'dots-studio/dots-3-note-preview:free',
        attempt: 2,
        providerStatus: 200,
        latencyMs: 25,
        outputCharacters: 50,
      })
      return {
        task: 'description',
        text: 'Generated description',
        model: 'dots-studio/dots-3-note-preview:free',
      }
    })

    await POST(request('description'))

    expect(
      mocks.info.mock.calls.find(
        ([, message]) => message === 'AI generation completed',
      )?.[0],
    ).toMatchObject({ firstTokenMs: 30, fallbackCount: 1, attempts: 2 })
  })

  it('emits request-correlated terminal telemetry when Ideas fail', async () => {
    mocks.parse.mockReturnValue({
      task: 'ideas',
      model: 'stealth/ox-alpha',
      input: { interests: 'tools' },
    })
    mocks.stream.mockImplementation(async function* ({ onTelemetry }) {
      onTelemetry({
        event: 'attempt_failed',
        model: 'stealth/ox-alpha',
        attempt: 1,
        providerStatus: 503,
        latencyMs: 20,
        errorClass: 'APIConnectionError',
      })
      throw Object.assign(new Error('AI provider is unavailable. Please try again.'), {
        statusCode: 502,
        providerStatus: 503,
        errorClass: 'APIConnectionError',
      })
    })

    const response = await POST(request('ideas'))
    const requestId = response.headers.get('X-Request-ID')
    const body = await response.text()

    expect(body).toContain('event: error')
    expect(body).toContain(`"requestId":"${requestId}"`)
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId,
        outcome: 'failed',
        errorClass: 'APIConnectionError',
      }),
      'AI stream failed',
    )
  })

  it('logs cancellation when the Ideas response reader disconnects', async () => {
    mocks.parse.mockReturnValue({
      task: 'ideas',
      model: 'stealth/ox-alpha',
      input: { interests: 'tools' },
    })
    mocks.stream.mockImplementation(async function* ({ signal }) {
      yield {
        event: 'meta',
        data: { model: 'stealth/ox-alpha', attempt: 1, total: 1 },
      }
      await new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('cancelled')))
      })
    })

    const response = await POST(request('ideas'))
    const requestId = response.headers.get('X-Request-ID')
    const reader = response.body?.getReader()
    await reader?.read()
    await reader?.cancel()
    await new Promise((resolve) => setImmediate(resolve))

    expect(mocks.info).toHaveBeenCalledWith(
      expect.objectContaining({ requestId, outcome: 'cancelled' }),
      'AI generation cancelled',
    )
  })
})
