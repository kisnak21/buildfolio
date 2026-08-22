export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { loginUserService } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'
import { assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { logAudit, requestContext } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const ctx = requestContext(req)
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`login:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 })

    const { email, password } = await req.json()

    if (!success) {
      await logAudit({
        action: 'auth.login_fail',
        targetType: 'auth',
        targetName: typeof email === 'string' ? email : null,
        metadata: { reason: 'rate limited' },
        ...ctx,
      })
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetInMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'email and password are required' },
        { status: 400 },
      )
    }
    const result = await loginUserService({ email, password })
    if (!result) {
      await logAudit({
        action: 'auth.login_fail',
        targetType: 'auth',
        targetName: email,
        metadata: { reason: 'invalid credentials' },
        ...ctx,
      })
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 },
      )
    }

    if ('accountBlocked' in result) {
      await logAudit({
        action: 'auth.login_fail',
        targetType: 'auth',
        targetName: result.email,
        metadata: { reason: result.status },
        ...ctx,
      })
      return NextResponse.json(
        {
          success: false,
          code:
            result.status === 'banned'
              ? 'ACCOUNT_BANNED'
              : 'ACCOUNT_SUSPENDED',
          message:
            result.status === 'banned'
              ? 'This account has been banned.'
              : 'This account is temporarily suspended.',
          ...(result.status === 'suspended' && {
            suspendedUntil: result.suspendedUntil?.toISOString(),
          }),
        },
        { status: 403 },
      )
    }

    if ('needsVerification' in result) {
      await logAudit({
        action: 'auth.login_fail',
        targetType: 'auth',
        targetName: result.email,
        metadata: { reason: 'email not verified' },
        ...ctx,
      })
      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email address before logging in.',
          needsVerification: true,
          email: result.email,
        },
        { status: 403 },
      )
    }

    const response = NextResponse.json({ success: true, data: result })

    // Set httpOnly cookie with JWT token
    response.cookies.set('buildfolio_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Set session flag cookie (non-sensitive, readable by middleware)
    response.cookies.set('buildfolio_session', '1', {
      httpOnly: false, // middleware needs to read this for redirect logic
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
