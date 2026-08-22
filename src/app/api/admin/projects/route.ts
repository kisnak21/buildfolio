export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/authMiddleware'
import { listAdminProjects } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'
import { isAllowedParam, parsePositiveInteger } from '@/lib/requestParams'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const page = parsePositiveInteger(searchParams.get('page'), 1)
    const limit = parsePositiveInteger(searchParams.get('limit'), 20, 100)
    if (
      page === null ||
      limit === null ||
      !isAllowedParam(status, ['visible', 'hidden', 'featured'] as const)
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination or status filter' },
        { status: 400 },
      )
    }
    const data = await listAdminProjects({
      search,
      category,
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
