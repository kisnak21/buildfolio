export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { deleteComment } from '@/lib/services/commentService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = authenticate(req)
  if (error) return error

  try {
    const comment = await deleteComment(params.id)
    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
