import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/middleware/authMiddleware'
import { getProjectById, toggleLikeProject } from '@/lib/services/projectService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = authenticate(req)
  if (error) return error

  const { id } = await params
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`like:${user!.id}:${ip}`, {
      max: 30,
      windowMs: 10 * 60 * 1000,
    })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const existingProject = await getProjectById(id)
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }

    const result = await toggleLikeProject(id, user!.id)
    return NextResponse.json({
      success: true,
      data: { liked: result.liked, likes: result.likes },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
