export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/authMiddleware'
import { listAdminProjects } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const data = await listAdminProjects({ search, category })
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}