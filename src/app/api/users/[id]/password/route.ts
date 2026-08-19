export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { changePassword } from '@/lib/services/userService'
import { authenticate, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { rateLimit } from '@/lib/rateLimit'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = authenticate(req)
  if (error) return error

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const { success, resetInMs } = await rateLimit(
    `change-password:${user!.id}:${ip}`,
    { max: 5, windowMs: 15 * 60 * 1000 },
  )
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many password change attempts. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
      },
    )
  }

  const { id } = await params

  // Ownership check
  if (user!.id !== id) {
    return NextResponse.json(
      { success: false, message: 'Forbidden: you can only change your own password' },
      { status: 403 },
    )
  }

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 },
      )
    }

    const result = await changePassword(id, currentPassword, newPassword)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
