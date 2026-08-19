export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/authMiddleware'
import { listAdminFlags } from '@/lib/services/flagService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100,
    )

    const result = await listAdminFlags({
      status: status as 'pending' | 'resolved' | 'dismissed' | undefined,
      page,
      limit,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}