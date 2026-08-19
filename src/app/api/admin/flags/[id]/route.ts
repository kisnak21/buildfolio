export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/authMiddleware'
import { updateFlagStatus } from '@/lib/services/flagService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'
import { logAudit, requestContext } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, admin } = await requireAdmin(req)
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()
    const status = body?.status
    if (status !== 'resolved' && status !== 'dismissed') {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 },
      )
    }

    const flag = await updateFlagStatus(id, status, admin.id)
    if (!flag) {
      return NextResponse.json(
        { success: false, message: 'Flag not found' },
        { status: 404 },
      )
    }

    await logAudit({
      actor: {
        id: admin.id,
        name: admin.name ?? null,
        email: admin.email ?? null,
      },
      action: status === 'resolved' ? 'flag.resolve' : 'flag.dismiss',
      targetType: 'flag',
      targetId: flag.id,
      targetName: `${flag.targetType}:${flag.targetId}`,
      metadata: { reason: flag.reason },
      ...requestContext(req),
    })

    return NextResponse.json({ success: true, data: flag })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}