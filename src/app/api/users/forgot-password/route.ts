export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'
import { assertSameOrigin } from '@/lib/middleware/authMiddleware'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    const { email } = await req.json()
    if (!email || typeof email !== 'string' || email.length > 254) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 },
      )
    }

    const { success, resetInMs } = await rateLimit(`forgot-password:${ip}`, { max: 3, windowMs: 15 * 60 * 1000 })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    // Generic response to prevent account enumeration
    await requestPasswordReset(email)
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a reset link has been sent.',
    })
  } catch (err: unknown) {
    console.error('FORGOT PASSWORD ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
