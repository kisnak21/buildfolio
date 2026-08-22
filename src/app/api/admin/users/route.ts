export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import {
  listAdminUsers,
  moderateAdminUser,
  updateAdminUser,
} from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'
import { logAudit, requestContext } from '@/lib/audit'
import { isAllowedParam, parsePositiveInteger } from '@/lib/requestParams'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const page = parsePositiveInteger(searchParams.get('page'), 1)
    const limit = parsePositiveInteger(searchParams.get('limit'), 20, 100)
    if (
      page === null ||
      limit === null ||
      !isAllowedParam(status, ['active', 'banned', 'suspended'] as const)
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination or status filter' },
        { status: 400 },
      )
    }
    const data = await listAdminUsers({
      search,
      status,
      page,
      limit,
    })
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}

export async function PATCH(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { admin, error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id query param is required' },
        { status: 400 },
      )
    }
    const body = await req.json()
    const { verified, role, action, until, reason } = body

    if (action !== undefined) {
      if (!['ban', 'suspend', 'restore'].includes(action)) {
        return NextResponse.json(
          { success: false, message: 'Invalid moderation action' },
          { status: 400 },
        )
      }
      if (id === admin!.id) {
        return NextResponse.json(
          { success: false, message: 'You cannot moderate your own account' },
          { status: 403 },
        )
      }
      const user = await moderateAdminUser({
        id,
        action,
        until,
        reason,
        adminId: admin!.id,
        audit: { actor: admin, ...requestContext(req) },
      })
      return NextResponse.json({ success: true, data: user })
    }

    if (role !== undefined && id === admin!.id && role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'You cannot demote yourself' },
        { status: 403 },
      )
    }

    const user = await updateAdminUser(id, { verified, role })
    const ctx = requestContext(req)
    if (role === 'admin') {
      await logAudit({
        actor: admin,
        action: 'user.promote',
        targetType: 'user',
        targetId: id,
        targetName: user.name,
        metadata: { role: 'user -> admin' },
        ...ctx,
      })
    } else if (role === 'user') {
      await logAudit({
        actor: admin,
        action: 'user.demote',
        targetType: 'user',
        targetId: id,
        targetName: user.name,
        metadata: { role: 'admin -> user' },
        ...ctx,
      })
    }
    if (verified !== undefined) {
      await logAudit({
        actor: admin,
        action: 'user.verify',
        targetType: 'user',
        targetId: id,
        targetName: user.name,
        metadata: { verified },
        ...ctx,
      })
    }
    return NextResponse.json({ success: true, data: user })
  } catch (err: unknown) {
    const requestError = httpError(err)
    if (
      requestError.statusCode !== undefined &&
      requestError.statusCode >= 400 &&
      requestError.statusCode < 500
    ) {
      return NextResponse.json(
        { success: false, message: requestError.message ?? 'Request failed' },
        { status: requestError.statusCode },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
