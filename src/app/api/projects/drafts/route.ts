export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createProject } from '@/lib/services/projectService'
import { requireActiveUser, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage, type ErrorLike } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = await requireActiveUser(req)
  if (error) return error

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`create-draft:${user!.id}:${ip}`, {
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

    const body = await req.json()
    const project = await createProject({
      title: body?.title,
      slug: body?.slug,
      description: body?.description,
      thumbnail: body?.thumbnail,
      github_url: body?.github_url,
      live_url: body?.live_url,
      category_id: body?.category_id,
      category: body?.category,
      technologies: body?.technologies,
      user_id: user!.id,
      status: 'DRAFT',
    })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (err) {
    const e = err as ErrorLike
    if (e.statusCode === 400) {
      return NextResponse.json(
        { success: false, message: e.message },
        { status: 400 },
      )
    }
    if (e.code === '23505' || e.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
