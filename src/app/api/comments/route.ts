export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByProject, addComment } from '@/lib/services/commentService'
import { authenticate } from '@/lib/middleware/authMiddleware'

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
    return NextResponse.json({ success: true, data: comments })
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
