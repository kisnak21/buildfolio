export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getBookmarksByUser,
  addBookmark,
  getBookmark,
} from '@/lib/services/bookmarkService'
import { authenticate, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { user, error } = authenticate(req)
  if (error) return error

  try {
    const bookmarks = await getBookmarksByUser(user!.id)
    return NextResponse.json({ success: true, data: bookmarks })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = authenticate(req)
  if (error) return error

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`bookmark:${user!.id}:${ip}`, {
      max: 20,
      windowMs: 60 * 1000,
    })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many bookmark requests. Slow down.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const { project_id } = await req.json()
    if (!project_id) {
      return NextResponse.json(
        { success: false, message: 'project_id is required' },
        { status: 400 },
      )
    }
    const user_id = user!.id
    const existing = await getBookmark({ user_id, project_id })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Already bookmarked' },
        { status: 409 },
      )
    }
    const bookmark = await addBookmark({ user_id, project_id })
    return NextResponse.json({ success: true, data: bookmark }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
