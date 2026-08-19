export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { listAdminTechs, createAdminTech } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'
import { logAudit, requestContext } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const data = await listAdminTechs()
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { admin, error } = await requireAdmin(req)
  if (error) return error

  try {
    const { name } = await req.json()
    const tech = await createAdminTech(name)
    await logAudit({
      actor: admin,
      action: 'tech.create',
      targetType: 'technology',
      targetId: tech.id,
      targetName: tech.name,
      ...requestContext(req),
    })
    return NextResponse.json({ success: true, data: tech }, { status: 201 })
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