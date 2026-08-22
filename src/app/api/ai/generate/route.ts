export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameOrigin,
  requireActiveUser,
} from '@/lib/middleware/authMiddleware'
import {
  isDistributedRateLimitConfigured,
  rateLimit,
} from '@/lib/rateLimit'
import {
  generateWithOpenRouter,
  parseAiRequest,
} from '@/lib/services/aiService'
import { errorStatus, httpError } from '@/lib/apiErrors'
import logger from '@/lib/logger'

const REQUEST_LIMIT = 20_000

const readLimitedBody = async (req: NextRequest) => {
  if (!req.body) return ''
  const reader = req.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let body = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > REQUEST_LIMIT) {
      await reader.cancel()
      throw Object.assign(new Error('Request body is too large'), {
        statusCode: 413,
      })
    }
    body += decoder.decode(value, { stream: true })
  }
  return body + decoder.decode()
}

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = await requireActiveUser(req)
  if (error || !user) return error

  if (
    process.env.NODE_ENV === 'production' &&
    !isDistributedRateLimitConfigured
  ) {
    return NextResponse.json(
      { success: false, message: 'AI generation is temporarily unavailable' },
      { status: 503 },
    )
  }

  if (!req.headers.get('content-type')?.startsWith('application/json')) {
    return NextResponse.json(
      { success: false, message: 'Content-Type must be application/json' },
      { status: 415 },
    )
  }

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > REQUEST_LIMIT) {
    return NextResponse.json(
      { success: false, message: 'Request body is too large' },
      { status: 413 },
    )
  }

  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const ingress = await rateLimit(`ai-ingress:${ip}`, {
      max: 30,
      windowMs: 10 * 60 * 1_000,
    })
    if (!ingress.success) {
      return NextResponse.json(
        { success: false, message: 'Too many AI requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(ingress.resetInMs / 1_000)) },
        },
      )
    }

    const rawBody = await readLimitedBody(req)
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 },
      )
    }
    const request = parseAiRequest(body)

    const hourly = await rateLimit(`ai-hour:${user.id}`, {
      max: 5,
      windowMs: 60 * 60 * 1_000,
    })
    if (!hourly.success) {
      return NextResponse.json(
        { success: false, message: 'AI hourly limit reached. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(hourly.resetInMs / 1_000)) },
        },
      )
    }

    const daily = await rateLimit(`ai-day:${user.id}`, {
      max: 15,
      windowMs: 24 * 60 * 60 * 1_000,
    })
    if (!daily.success) {
      return NextResponse.json(
        { success: false, message: 'AI daily limit reached. Try again tomorrow.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(daily.resetInMs / 1_000)) },
        },
      )
    }

    const globalMinute = await rateLimit('ai-global-minute', {
      max: 20,
      windowMs: 60 * 1_000,
    })
    if (!globalMinute.success) {
      return NextResponse.json(
        { success: false, message: 'Free AI capacity is busy. Try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(globalMinute.resetInMs / 1_000)),
          },
        },
      )
    }

    const globalDay = await rateLimit('ai-global-day', {
      max: 50,
      windowMs: 24 * 60 * 60 * 1_000,
    })
    if (!globalDay.success) {
      return NextResponse.json(
        { success: false, message: 'Daily free AI capacity has been reached.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(globalDay.resetInMs / 1_000)) },
        },
      )
    }

    const result = await generateWithOpenRouter({
      ...request,
      signal: req.signal,
    })
    logger.info(
      { task: request.task, model: result.model },
      'AI generation completed',
    )
    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Remaining-Hour': String(hourly.remaining),
          'X-RateLimit-Remaining-Day': String(daily.remaining),
        },
      },
    )
  } catch (err: unknown) {
    const status = errorStatus(err)
    logger.warn({ status }, 'AI generation failed')
    return NextResponse.json(
      {
        success: false,
        message:
          status >= 500 && status !== 502 && status !== 503 && status !== 504
            ? 'AI generation failed'
            : httpError(err).message || 'AI generation failed',
      },
      { status },
    )
  }
}
