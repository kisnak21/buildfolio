/**
 * Distributed rate limiter backed by Upstash Redis (REST).
 * Falls back to an in-memory limiter when UPSTASH_REDIS_REST_URL/TOKEN
 * are not configured (e.g. local development).
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { Duration } from '@upstash/ratelimit'

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitConfig {
  max: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetInMs: number
}

const memoryStore = new Map<string, RateLimitEntry>()
const limiterCache = new Map<string, Ratelimit>()

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

export const isDistributedRateLimitConfigured = hasUpstash

/**
 * Per-user AI generation quotas. Shared by the generate and quota routes so
 * limits cannot drift between them. Consumption stays success-only; concurrent
 * requests can race past the counter until atomic counters land.
 */
export const AI_QUOTAS = {
  hourly: {
    key: (userId: string) => `ai-success-hour-v2:${userId}`,
    config: { max: 5, windowMs: 60 * 60 * 1_000 },
  },
  daily: {
    key: (userId: string) => `ai-success-day-v2:${userId}`,
    config: { max: 15, windowMs: 24 * 60 * 60 * 1_000 },
  },
} as const

function toDuration(windowMs: number): Duration {
  return `${windowMs} ms` as Duration
}

function getUpstashLimiter(policy: string, config: RateLimitConfig) {
  const cacheKey = `${policy}:${config.max}:${config.windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(config.max, toDuration(config.windowMs)),
      prefix: `buildfolio:ratelimit:${policy}`,
      ephemeralCache: new Map(),
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

function memoryRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.max - 1, resetInMs: config.windowMs }
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0, resetInMs: entry.resetAt - now }
  }

  entry.count++
  return {
    success: true,
    remaining: config.max - entry.count,
    resetInMs: entry.resetAt - now,
  }
}

function memoryRateLimitStatus(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now >= entry.resetAt) {
    return { success: true, remaining: config.max, resetInMs: config.windowMs }
  }

  const remaining = Math.max(config.max - entry.count, 0)
  return {
    success: remaining > 0,
    remaining,
    resetInMs: entry.resetAt - now,
  }
}

export async function rateLimitStatus(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (hasUpstash) {
    const separator = key.indexOf(':')
    const policy = separator === -1 ? key : key.slice(0, separator)
    const identifier = separator === -1 ? key : key.slice(separator + 1)
    const limiter = getUpstashLimiter(policy, config)

    try {
      const result = await limiter.getRemaining(identifier)
      return {
        success: result.remaining > 0,
        remaining: result.remaining,
        resetInMs: Math.max(result.reset - Date.now(), 0),
      }
    } catch {
      return { success: false, remaining: 0, resetInMs: 5_000 }
    }
  }

  return memoryRateLimitStatus(key, config)
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (hasUpstash) {
    const separator = key.indexOf(':')
    const policy = separator === -1 ? key : key.slice(0, separator)
    const identifier = separator === -1 ? key : key.slice(separator + 1)
    const limiter = getUpstashLimiter(policy, config)
    const result = await limiter.limit(identifier)
    if (result.reason === 'timeout') {
      return { success: false, remaining: 0, resetInMs: 5_000 }
    }
    return {
      success: result.success,
      remaining: result.remaining,
      resetInMs: Math.max(result.reset - Date.now(), 0),
    }
  }
  return memoryRateLimit(key, config)
}

// Cleanup stale in-memory entries every 5 minutes (only used without Upstash)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now >= entry.resetAt) memoryStore.delete(key)
    }
  }, 5 * 60 * 1000)
}
