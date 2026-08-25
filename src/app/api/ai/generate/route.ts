export const runtime = 'nodejs'
export const maxDuration = 60

import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameOrigin,
  requireActiveUser,
} from '@/lib/middleware/authMiddleware'
import {
  AI_QUOTAS,
  isDistributedRateLimitConfigured,
  rateLimit,
  rateLimitStatus,
} from '@/lib/rateLimit'
import {
  generateWithOpenRouter,
  parseAiRequest,
  streamIdeasWithOpenRouter,
  type AiStreamEvent,
  type AiTelemetryEvent,
} from '@/lib/services/aiService'
import type { AiTask } from '@/lib/aiModels'
import { errorStatus, httpError } from '@/lib/apiErrors'
import logger from '@/lib/logger'

const REQUEST_LIMIT = 20_000
const GLOBAL_MINUTE_QUOTA = { max: 20, windowMs: 60 * 1_000 }
const GLOBAL_DAY_QUOTA = { max: 50, windowMs: 24 * 60 * 60 * 1_000 }
const AI_STREAM_DEADLINE_MS = 52_000

const sseEvent = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

const withRequestId = <T extends Response>(response: T, requestId: string) => {
  response.headers.set('X-Request-ID', requestId)
  return response
}

const jsonResponse = (
  body: unknown,
  init: ResponseInit,
  requestId: string,
) => withRequestId(NextResponse.json(body, init), requestId)

const errorClass = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'errorClass' in error &&
  typeof error.errorClass === 'string'
    ? error.errorClass.slice(0, 80)
    : error instanceof Error
      ? error.name.slice(0, 80) || 'Error'
      : 'UnknownError'

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
  const requestId = randomUUID()
  const requestStartedAt = performance.now()
  const requestStartedAtIso = new Date().toISOString()
  let observedTask: AiTask | undefined
  let attempts = 0
  let fallbackCount = 0
  let firstTokenMs: number | undefined
  let providerStatus: number | undefined
  let outputCharacters = 0
  let actualModel: string | undefined
  const firstTokenByAttempt = new Map<number, number>()

  const csrfError = assertSameOrigin(req)
  if (csrfError) return withRequestId(csrfError, requestId)
  const { user, error } = await requireActiveUser(req)
  if (error || !user) return withRequestId(error, requestId)

  if (
    process.env.NODE_ENV === 'production' &&
    !isDistributedRateLimitConfigured
  ) {
    return jsonResponse(
      { success: false, message: 'AI generation is temporarily unavailable' },
      { status: 503 },
      requestId,
    )
  }

  if (!req.headers.get('content-type')?.startsWith('application/json')) {
    return jsonResponse(
      { success: false, message: 'Content-Type must be application/json' },
      { status: 415 },
      requestId,
    )
  }

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > REQUEST_LIMIT) {
    return jsonResponse(
      { success: false, message: 'Request body is too large' },
      { status: 413 },
      requestId,
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
      return jsonResponse(
        { success: false, message: 'Too many AI requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(ingress.resetInMs / 1_000)) },
        },
        requestId,
      )
    }

    const rawBody = await readLimitedBody(req)
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return jsonResponse(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 },
        requestId,
      )
    }
    const request = parseAiRequest(body)
    observedTask = request.task
    const onTelemetry = (event: AiTelemetryEvent) => {
      if (event.event === 'attempt_started') attempts = event.attempt
      if (event.event === 'fallback') fallbackCount += 1
      if (event.event === 'first_token') {
        firstTokenByAttempt.set(
          event.attempt,
          Math.round(performance.now() - requestStartedAt),
        )
      }
      if ('providerStatus' in event) providerStatus = event.providerStatus
      if ('actualModel' in event) actualModel = event.actualModel
      if (event.event === 'attempt_succeeded') {
        outputCharacters = event.outputCharacters
        firstTokenMs = firstTokenByAttempt.get(event.attempt)
      }

      const metadata = {
        requestId,
        task: request.task,
        provider: 'openrouter',
        ...event,
      }
      if (event.event === 'attempt_failed' || event.event === 'fallback') {
        logger.warn(metadata, `AI ${event.event}`)
      } else {
        logger.info(metadata, `AI ${event.event}`)
      }
    }
    logger.info(
      {
        requestId,
        task: request.task,
        model: request.model,
        provider: 'openrouter',
        startedAt: requestStartedAtIso,
      },
      'AI generation started',
    )

    const hourlyKey = AI_QUOTAS.hourly.key(user.id)
    const dailyKey = AI_QUOTAS.daily.key(user.id)
    const globalMinuteKey = 'ai-success-global-minute-v2'
    const globalDayKey = 'ai-success-global-day-v2'
    const logQuotaRejection = (reason: string) => {
      logger.warn(
        {
          requestId,
          task: request.task,
          provider: 'openrouter',
          status: 429,
          outcome: 'rejected',
          reason,
          latencyMs: Math.round(performance.now() - requestStartedAt),
        },
        'AI generation rejected',
      )
    }

    const hourly = await rateLimitStatus(hourlyKey, AI_QUOTAS.hourly.config)
    if (!hourly.success) {
      logQuotaRejection('hourly_quota')
      return jsonResponse(
        { success: false, message: 'AI hourly limit reached. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(hourly.resetInMs / 1_000)) },
        },
        requestId,
      )
    }

    const daily = await rateLimitStatus(dailyKey, AI_QUOTAS.daily.config)
    if (!daily.success) {
      logQuotaRejection('daily_quota')
      return jsonResponse(
        { success: false, message: 'AI daily limit reached. Try again tomorrow.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(daily.resetInMs / 1_000)) },
        },
        requestId,
      )
    }

    const globalMinute = await rateLimitStatus(
      globalMinuteKey,
      GLOBAL_MINUTE_QUOTA,
    )
    if (!globalMinute.success) {
      logQuotaRejection('global_minute_quota')
      return jsonResponse(
        { success: false, message: 'Free AI capacity is busy. Try again shortly.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(globalMinute.resetInMs / 1_000)),
          },
        },
        requestId,
      )
    }

    const globalDay = await rateLimitStatus(globalDayKey, GLOBAL_DAY_QUOTA)
    if (!globalDay.success) {
      logQuotaRejection('global_daily_quota')
      return jsonResponse(
        { success: false, message: 'Daily free AI capacity has been reached.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(globalDay.resetInMs / 1_000)) },
        },
        requestId,
      )
    }

    const consumeSuccessfulQuota = async () => {
      const consumed = await Promise.allSettled([
        rateLimit(hourlyKey, AI_QUOTAS.hourly.config),
        rateLimit(dailyKey, AI_QUOTAS.daily.config),
        rateLimit(globalMinuteKey, GLOBAL_MINUTE_QUOTA),
        rateLimit(globalDayKey, GLOBAL_DAY_QUOTA),
      ])
      const consumedHourly =
        consumed[0].status === 'fulfilled' ? consumed[0].value : hourly
      const consumedDaily =
        consumed[1].status === 'fulfilled' ? consumed[1].value : daily
      if (consumed.some((entry) => entry.status === 'rejected')) {
        logger.warn(
          { requestId, task: request.task },
          'AI quota update failed after success',
        )
      }
      return { consumedHourly, consumedDaily }
    }

    if (request.task === 'ideas') {
      const generationController = new AbortController()
      let cancelled = false
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          const abortFromRequest = () =>
            generationController.abort(
              new DOMException('AI generation cancelled', 'AbortError'),
            )
          const deadline = setTimeout(
            () =>
              generationController.abort(
                new DOMException('AI generation deadline exceeded', 'TimeoutError'),
              ),
            AI_STREAM_DEADLINE_MS,
          )
          if (req.signal.aborted) generationController.abort()
          else req.signal.addEventListener('abort', abortFromRequest, { once: true })

          const send = (
            event: AiStreamEvent['event'] | 'quota',
            data: unknown,
          ) => {
            if (cancelled || controller.desiredSize === null) return
            const enriched =
              typeof data === 'object' && data !== null && !Array.isArray(data)
                ? { ...data, requestId }
                : { data, requestId }
            controller.enqueue(encoder.encode(sseEvent(event, enriched)))
          }
          let completed = false

          try {
            for await (const event of streamIdeasWithOpenRouter({
              model: request.model,
              input: request.input,
              signal: generationController.signal,
              onTelemetry,
            })) {
              send(event.event, event.data)
              if (event.event === 'done') completed = true
            }
            if (completed) {
              const { consumedHourly, consumedDaily } =
                await consumeSuccessfulQuota()
              send('quota', {
                hourly: {
                  remaining: consumedHourly.remaining,
                  limit: AI_QUOTAS.hourly.config.max,
                },
                daily: {
                  remaining: consumedDaily.remaining,
                  limit: AI_QUOTAS.daily.config.max,
                },
              })
              logger.info(
                {
                  requestId,
                  task: request.task,
                  model: actualModel,
                  provider: 'openrouter',
                  providerStatus,
                  attempts,
                  fallbackCount,
                  firstTokenMs,
                  latencyMs: Math.round(performance.now() - requestStartedAt),
                  outputCharacters,
                  outcome: 'success',
                },
                'AI generation completed',
              )
            }
          } catch (error) {
            if (!req.signal.aborted && !cancelled) {
              const status = errorStatus(error)
              logger.warn(
                {
                  requestId,
                  status,
                  task: request.task,
                  provider: 'openrouter',
                  providerStatus,
                  attempts,
                  fallbackCount,
                  firstTokenMs,
                  latencyMs: Math.round(performance.now() - requestStartedAt),
                  outputCharacters,
                  outcome: 'failed',
                  errorClass: errorClass(error),
                  errorMessage:
                    httpError(error).message || 'AI generation failed',
                },
                'AI stream failed',
              )
              send('error', {
                message: httpError(error).message || 'AI generation failed',
              })
            }
          } finally {
            clearTimeout(deadline)
            req.signal.removeEventListener('abort', abortFromRequest)
            if (!completed && (req.signal.aborted || cancelled)) {
              logger.info(
                {
                  requestId,
                  task: request.task,
                  provider: 'openrouter',
                  providerStatus,
                  attempts,
                  fallbackCount,
                  firstTokenMs,
                  latencyMs: Math.round(performance.now() - requestStartedAt),
                  outputCharacters,
                  outcome: 'cancelled',
                },
                'AI generation cancelled',
              )
            }
            if (!cancelled) controller.close()
          }
        },
        cancel() {
          cancelled = true
          generationController.abort()
        },
      })

      return new Response(stream, {
        headers: {
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Content-Type': 'text/event-stream; charset=utf-8',
          'X-Accel-Buffering': 'no',
          'X-Request-ID': requestId,
        },
      })
    }

    const result = await (async () => {
      const generationController = new AbortController()
      const abortFromRequest = () =>
        generationController.abort(
          new DOMException('AI generation cancelled', 'AbortError'),
        )
      const deadline = setTimeout(
        () =>
          generationController.abort(
            new DOMException('AI generation deadline exceeded', 'TimeoutError'),
          ),
        AI_STREAM_DEADLINE_MS,
      )
      if (req.signal.aborted) generationController.abort()
      else req.signal.addEventListener('abort', abortFromRequest, { once: true })
      try {
        return await generateWithOpenRouter({
          ...request,
          signal: generationController.signal,
          onTelemetry,
        })
      } finally {
        clearTimeout(deadline)
        req.signal.removeEventListener('abort', abortFromRequest)
      }
    })()
    const { consumedHourly, consumedDaily } = await consumeSuccessfulQuota()
    logger.info(
      {
        requestId,
        task: request.task,
        model: result.model,
        provider: 'openrouter',
        providerStatus,
        attempts,
        fallbackCount,
        firstTokenMs,
        latencyMs: Math.round(performance.now() - requestStartedAt),
        outputCharacters,
        outcome: 'success',
      },
      'AI generation completed',
    )
    return jsonResponse(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Remaining-Hour': String(consumedHourly.remaining),
          'X-RateLimit-Remaining-Day': String(consumedDaily.remaining),
        },
      },
      requestId,
    )
  } catch (err: unknown) {
    const status = errorStatus(err)
    if (status === 499) {
      logger.info(
        {
          requestId,
          status,
          task: observedTask,
          provider: observedTask ? 'openrouter' : undefined,
          attempts,
          fallbackCount,
          firstTokenMs,
          latencyMs: Math.round(performance.now() - requestStartedAt),
          outputCharacters,
          outcome: 'cancelled',
        },
        'AI generation cancelled',
      )
      return jsonResponse(
        { success: false, message: 'AI generation cancelled.' },
        { status },
        requestId,
      )
    }
    logger.warn(
      {
        requestId,
        status,
        task: observedTask,
        provider: observedTask ? 'openrouter' : undefined,
        providerStatus,
        attempts,
        fallbackCount,
        firstTokenMs,
        latencyMs: Math.round(performance.now() - requestStartedAt),
        outputCharacters,
        outcome: 'failed',
        errorClass: errorClass(err),
        errorMessage: httpError(err).message || 'AI generation failed',
      },
      'AI generation failed',
    )
    return jsonResponse(
      {
        success: false,
        message:
          status >= 500 && status !== 502 && status !== 503 && status !== 504
            ? 'AI generation failed'
            : httpError(err).message || 'AI generation failed',
      },
      { status },
      requestId,
    )
  }
}
