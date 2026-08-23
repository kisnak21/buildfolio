export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameOrigin,
  requireActiveUser,
} from '@/lib/middleware/authMiddleware'
import {
  isDistributedRateLimitConfigured,
  rateLimit,
  rateLimitStatus,
} from '@/lib/rateLimit'
import {
  generateWithOpenRouter,
  parseAiRequest,
  streamIdeasWithOpenRouter,
  type AiStreamEvent,
} from '@/lib/services/aiService'
import { errorStatus, httpError } from '@/lib/apiErrors'
import logger from '@/lib/logger'

const REQUEST_LIMIT = 20_000
const HOURLY_QUOTA = { max: 5, windowMs: 60 * 60 * 1_000 }
const DAILY_QUOTA = { max: 15, windowMs: 24 * 60 * 60 * 1_000 }
const GLOBAL_MINUTE_QUOTA = { max: 20, windowMs: 60 * 1_000 }
const GLOBAL_DAY_QUOTA = { max: 50, windowMs: 24 * 60 * 60 * 1_000 }

const sseEvent = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

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

    const hourlyKey = `ai-success-hour-v2:${user.id}`
    const dailyKey = `ai-success-day-v2:${user.id}`
    const globalMinuteKey = 'ai-success-global-minute-v2'
    const globalDayKey = 'ai-success-global-day-v2'

    const hourly = await rateLimitStatus(hourlyKey, HOURLY_QUOTA)
    if (!hourly.success) {
      return NextResponse.json(
        { success: false, message: 'AI hourly limit reached. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(hourly.resetInMs / 1_000)) },
        },
      )
    }

    const daily = await rateLimitStatus(dailyKey, DAILY_QUOTA)
    if (!daily.success) {
      return NextResponse.json(
        { success: false, message: 'AI daily limit reached. Try again tomorrow.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(daily.resetInMs / 1_000)) },
        },
      )
    }

    const globalMinute = await rateLimitStatus(
      globalMinuteKey,
      GLOBAL_MINUTE_QUOTA,
    )
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

    const globalDay = await rateLimitStatus(globalDayKey, GLOBAL_DAY_QUOTA)
    if (!globalDay.success) {
      return NextResponse.json(
        { success: false, message: 'Daily free AI capacity has been reached.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(globalDay.resetInMs / 1_000)) },
        },
      )
    }

    const consumeSuccessfulQuota = async () => {
      const consumed = await Promise.allSettled([
        rateLimit(hourlyKey, HOURLY_QUOTA),
        rateLimit(dailyKey, DAILY_QUOTA),
        rateLimit(globalMinuteKey, GLOBAL_MINUTE_QUOTA),
        rateLimit(globalDayKey, GLOBAL_DAY_QUOTA),
      ])
      const consumedHourly =
        consumed[0].status === 'fulfilled' ? consumed[0].value : hourly
      const consumedDaily =
        consumed[1].status === 'fulfilled' ? consumed[1].value : daily
      if (consumed.some((entry) => entry.status === 'rejected')) {
        logger.warn({ task: request.task }, 'AI quota update failed after success')
      }
      return { consumedHourly, consumedDaily }
    }

    if (request.task === 'ideas') {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          const send = (event: AiStreamEvent['event'], data: unknown) => {
            controller.enqueue(encoder.encode(sseEvent(event, data)))
          }
          let completed = false

          try {
            for await (const event of streamIdeasWithOpenRouter({
              model: request.model,
              input: request.input,
              signal: req.signal,
            })) {
              send(event.event, event.data)
              if (event.event === 'done') completed = true
            }
            if (completed) await consumeSuccessfulQuota()
          } catch (error) {
            if (!req.signal.aborted) {
              const status = errorStatus(error)
              logger.warn({ status, task: request.task }, 'AI stream failed')
              send('error', {
                message: httpError(error).message || 'AI generation failed',
              })
            }
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Content-Type': 'text/event-stream; charset=utf-8',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    const result = await generateWithOpenRouter({
      ...request,
      signal: req.signal,
    })
    const { consumedHourly, consumedDaily } = await consumeSuccessfulQuota()
    logger.info(
      { task: request.task, model: result.model },
      'AI generation completed',
    )
    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Remaining-Hour': String(consumedHourly.remaining),
          'X-RateLimit-Remaining-Day': String(consumedDaily.remaining),
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
