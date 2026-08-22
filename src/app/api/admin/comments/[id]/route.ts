export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import {
  deleteAdminComment,
  moderateAdminComment,
} from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'
import { logAudit, requestContext } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { admin, error } = await requireAdmin(req)
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()
    if (typeof body?.hidden !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'hidden must be a boolean' },
        { status: 400 },
      )
    }
    const reason = typeof body?.reason === 'string' ? body.reason : undefined
    const comment = await moderateAdminComment({
      id,
      hidden: body.hidden,
      reason,
      adminId: admin!.id,
      audit: { actor: admin, ...requestContext(req) },
    })
    return NextResponse.json({ success: true, data: comment })
  } catch (err: unknown) {
    const requestError = httpError(err)
    return NextResponse.json(
      {
        success: false,
        message:
          requestError.statusCode && requestError.statusCode < 500
            ? requestError.message || 'Request failed'
            : dbErrorMessage(err),
      },
      { status: errorStatus(err) },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { admin, error } = await requireAdmin(req)
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
    await logAudit({
      actor: admin,
      action: 'comment.delete',
      targetType: 'comment',
      targetId: id,
      targetName: result.content.slice(0, 100),
      ...requestContext(req),
    })
    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
