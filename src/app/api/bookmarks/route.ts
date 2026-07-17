export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getBookmarksByUser,
  addBookmark,
  getBookmark,
} from '@/lib/services/bookmarkService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId query param is required' },
        { status: 400 },
      )
    }
    const bookmarks = await getBookmarksByUser(userId)
    return NextResponse.json({ success: true, data: bookmarks })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = authenticate(req)
  if (error) return error

  try {
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
