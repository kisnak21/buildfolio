import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/middleware/authMiddleware'
import { getProjectById, updateProject } from '@/lib/services/projectService'
import { dbErrorMessage } from '@/lib/apiErrors'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = authenticate(req)
  if (error) return error

  const { id } = await params
  try {
    const existingProject = await getProjectById(id)
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }

    const newLikes = (existingProject.likes || 0) + 1
    const project = await updateProject(id, { likes: newLikes })
    
    return NextResponse.json({ success: true, data: project })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
