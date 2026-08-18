export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { deleteAdminTech } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'

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
    const result = await deleteAdminTech(id)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Technology not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: 'Technology deleted' })
  } catch (err: unknown) {
    if (httpError(err).statusCode === 400) {
      return NextResponse.json(
        { success: false, message: httpError(err).message ?? "Request failed" },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}