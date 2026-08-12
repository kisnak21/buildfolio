import { NextRequest, NextResponse } from 'next/server'
import { deleteComment, getCommentById } from '@/lib/services/commentService'
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
    // Ownership check FIRST: only comment author can delete
    const comment = await getCommentById(id)
    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 },
      )
    }
    if (comment.user_id !== user!.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you can only delete your own comment' },
        { status: 403 },
      )
    }
    await deleteComment(id)
    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
