export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { removeBookmark } from '@/lib/services/bookmarkService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = authenticate(req)
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
    return NextResponse.json({ success: true, message: 'Bookmark removed' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
