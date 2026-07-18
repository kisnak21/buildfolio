import { NextRequest, NextResponse } from 'next/server'
import { deleteComment } from '@/lib/services/commentService'
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
    const comment = await deleteComment(id)
    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 },
      )
    }
    // Ownership check: only comment author can delete
    if (comment.user_id !== user!.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you can only delete your own comment' },
        { status: 403 },
      )
    }
    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
