export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/authMiddleware'
import { listAdminAuditLogs } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20),
    )
    const action = searchParams.get('action') || undefined
    const search = searchParams.get('search') || undefined
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const data = await listAdminAuditLogs({
      page,
      limit,
      action,
      search,
      from,
      to,
    })
    return NextResponse.json({ success: true, ...data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}