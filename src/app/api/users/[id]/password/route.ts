export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { changePassword } from '@/lib/services/userService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = authenticate(req)
  if (error) return error

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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: err.statusCode || 500 },
    )
  }
}
