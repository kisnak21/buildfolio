export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { publishProject } from '@/lib/services/projectService'
import { requireActiveUser, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = await requireActiveUser(req)
  if (error) return error

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`publish-project:${user!.id}:${ip}`, {
      max: 30,
      windowMs: 15 * 60 * 1000,
    })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many publish requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const { id } = await params
    const project = await publishProject(id, user!.id)
    return NextResponse.json({ success: true, data: project })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
