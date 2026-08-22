export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import {
  deleteAdminProject,
  moderateAdminProject,
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
    const hidden = typeof body?.hidden === 'boolean' ? body.hidden : undefined
    const featured =
      typeof body?.featured === 'boolean' ? body.featured : undefined
    const reason = typeof body?.reason === 'string' ? body.reason : undefined
    const project = await moderateAdminProject({
      id,
      hidden,
      featured,
      reason,
      adminId: admin!.id,
      audit: { actor: admin, ...requestContext(req) },
    })
    return NextResponse.json({ success: true, data: project })
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
    const result = await deleteAdminProject(id)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }
    await logAudit({
      actor: admin,
      action: 'project.delete',
      targetType: 'project',
      targetId: id,
      targetName: result.title,
      ...requestContext(req),
    })
    return NextResponse.json({ success: true, message: 'Project deleted' })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
