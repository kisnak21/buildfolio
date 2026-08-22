import { NextRequest, NextResponse } from 'next/server'
import { requireActiveUser } from '@/lib/middleware/authMiddleware'
import { getLikedProjectsByUser } from '@/lib/services/projectService'
import { dbErrorMessage } from '@/lib/apiErrors'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { user, error } = await requireActiveUser(req)
  if (error) return error

  try {
    const projects = await getLikedProjectsByUser(user!.id)
    return NextResponse.json({ success: true, data: projects })
  } catch (err) {
    return NextResponse.json({ success: false, message: dbErrorMessage(err) }, { status: 500 })
  }
}
