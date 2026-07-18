/**
 * Simple in-memory rate limiter for API routes.
 * Resets on server restart — fine for single-instance deployment.
 */
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  max: number    // max requests
  windowMs: number  // time window in ms
}

export function rateLimit(key: string, config: RateLimitConfig): {
  success: boolean
  remaining: number
  resetInMs: number
} {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.max - 1, resetInMs: config.windowMs }
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0, resetInMs: entry.resetAt - now }
  }

  entry.count++
  return { success: true, remaining: config.max - entry.count, resetInMs: entry.resetAt - now }
}

// Cleanup stale entries every 5 minutes (prevent memory leak)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}
