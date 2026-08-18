export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { deleteAdminComment } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { error } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  try {
    const result = await deleteAdminComment(id)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}