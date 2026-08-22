export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByProject, addComment } from '@/lib/services/commentService'
import { requireActiveUser, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage, errorStatus, type ErrorLike } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'
import { publicCacheHeaders } from '@/lib/api/cacheHeaders'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json(
        { success: false, message: 'projectId query param is required' },
        { status: 400 },
      )
    }
    const comments = await getCommentsByProject(projectId)
    return NextResponse.json({ success: true, data: comments }, { headers: publicCacheHeaders })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = await requireActiveUser(req)
  if (error) return error

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`comment:${user!.id}:${ip}`, {
      max: 15,
      windowMs: 60 * 1000,
    })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many comments. Slow down.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const { content, project_id } = await req.json()
    if (!content || !project_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'content and project_id are required',
        },
        { status: 400 },
      )
    }
    const comment = await addComment({ content, user_id: user!.id, project_id })
    return NextResponse.json({ success: true, data: comment }, { status: 201 })
  } catch (err) {
    const e = err as ErrorLike
    if (e.statusCode === 400) {
      return NextResponse.json(
        { success: false, message: e.message },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
