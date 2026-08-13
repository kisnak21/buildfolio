export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    const { success, resetInMs } = await rateLimit(`reset-password:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const { token, newPassword } = await req.json()
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'token and newPassword are required' },
        { status: 400 },
      )
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 8 characters with uppercase, lowercase, and a number',
        },
        { status: 400 },
      )
    }

    const result = await resetPassword(token, newPassword)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    })
  } catch (err: unknown) {
    console.error('RESET PASSWORD ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
