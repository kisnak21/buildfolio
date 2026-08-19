export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'
import { assertSameOrigin } from '@/lib/middleware/authMiddleware'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const { success } = await rateLimit(`log-error:${ip}`, {
    max: 60,
    windowMs: 60 * 1000,
  })
  if (!success) {
    return new NextResponse(null, { status: 204 })
  }

  try {
    const body = await req.json()
    const message =
      typeof body?.message === 'string' ? body.message.slice(0, 2000) : undefined
    const digest =
      typeof body?.digest === 'string' ? body.digest.slice(0, 64) : undefined
    const path =
      typeof body?.path === 'string' ? body.path.slice(0, 500) : undefined

    logger.error(
      {
        digest,
        path,
        userAgent: req.headers.get('user-agent')?.slice(0, 512) || undefined,
        source: 'client',
      },
      message ? `client error: ${message}` : 'client error',
    )
  } catch {
    // Ignore malformed payloads; the endpoint is best-effort
  }

  return new NextResponse(null, { status: 204 })
}