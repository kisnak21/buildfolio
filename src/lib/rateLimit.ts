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

const memoryStore = new Map<string, RateLimitEntry>()
const limiterCache = new Map<string, Ratelimit>()

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

function toDuration(windowMs: number): Duration {
  return `${windowMs} ms` as Duration
}

function getUpstashLimiter(key: string, config: RateLimitConfig) {
  const cacheKey = `${key}:${config.max}:${config.windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(config.max, toDuration(config.windowMs)),
      prefix: `buildfolio:ratelimit:${key}`,
      ephemeralCache: new Map(),
    })
    limiterCache.set(cacheKey, limiter)
  }
  return limiter
}

function memoryRateLimit(
  key: string,
  config: RateLimitConfig,
): { success: boolean; remaining: number; resetInMs: number } {
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

export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ success: boolean; remaining: number; resetInMs: number }> {
  if (hasUpstash) {
    const limiter = getUpstashLimiter(key, config)
    const result = await limiter.limit(key)
    return { success: result.success, remaining: result.remaining, resetInMs: 0 }
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
