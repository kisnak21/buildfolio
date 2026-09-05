export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameOrigin,
  requireActiveUser,
} from '@/lib/middleware/authMiddleware'
import { createDraftProject } from '@/lib/services/projectService'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = await requireActiveUser(req)
  if (error || !user) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const { success, resetInMs } = await rateLimit(`create-draft:${user.id}:${ip}`, {
    max: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many draft creations. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
      },
    )
  }

  try {
    const body = await req.json()
    const draft = await createDraftProject({
      title: typeof body.title === 'string' ? body.title : '',
      description:
        typeof body.description === 'string' ? body.description : '',
      thumbnail:
        typeof body.thumbnail === 'string' ? body.thumbnail : undefined,
      github_url:
        typeof body.github_url === 'string' ? body.github_url : undefined,
      live_url: typeof body.live_url === 'string' ? body.live_url : undefined,
      user_id: user.id,
      category: typeof body.category === 'string' ? body.category : undefined,
      technologies: Array.isArray(body.technologies)
        ? body.technologies.filter(
            (value: unknown): value is string => typeof value === 'string',
          )
        : [],
    })
    return NextResponse.json({ success: true, data: draft }, { status: 201 })
  } catch (routeError) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(routeError) },
      { status: errorStatus(routeError) },
    )
  }
}
