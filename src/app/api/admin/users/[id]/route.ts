export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { deleteAdminUser } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { admin, error } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  if (id === admin!.id) {
    return NextResponse.json(
      { success: false, message: 'You cannot delete your own account' },
      { status: 403 },
    )
  }

  try {
    const result = await deleteAdminUser(id)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (err: unknown) {
    if (httpError(err).statusCode === 403) {
      return NextResponse.json(
        { success: false, message: httpError(err).message ?? "Request failed" },
        { status: 403 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}