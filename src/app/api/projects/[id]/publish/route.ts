export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameOrigin,
  requireActiveUser,
} from '@/lib/middleware/authMiddleware'
import { publishDraftProject } from '@/lib/services/projectService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = await requireActiveUser(req)
  if (error || !user) return error

  try {
    const { id } = await params
    const project = await publishDraftProject(id, user.id)
    return NextResponse.json({ success: true, data: project })
  } catch (routeError) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(routeError) },
      { status: errorStatus(routeError) },
    )
  }
}
