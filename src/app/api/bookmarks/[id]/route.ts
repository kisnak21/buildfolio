import { NextRequest, NextResponse } from 'next/server'
import { removeBookmark } from '@/lib/services/bookmarkService'
import { authenticate } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage } from '@/lib/apiErrors'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = authenticate(req)
  if (error) return error

  const { id } = await params
  try {
    const bookmark = await removeBookmark(id)
    if (!bookmark) {
      return NextResponse.json(
        { success: false, message: 'Bookmark not found' },
        { status: 404 },
      )
    }
    // Ownership check: only bookmark owner can delete
    if (bookmark.user_id !== user!.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you can only remove your own bookmark' },
        { status: 403 },
      )
    }
    return NextResponse.json({ success: true, message: 'Bookmark removed' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
