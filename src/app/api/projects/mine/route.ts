export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireActiveUser } from '@/lib/middleware/authMiddleware'
import { getProjectsByOwner } from '@/lib/services/projectService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  const { user, error } = await requireActiveUser(req)
  if (error) return error

  try {
    const projects = await getProjectsByOwner(user.id)
    return NextResponse.json({ success: true, data: projects })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
