export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getProjectById,
  updateProject,
  deleteProject,
} from '@/lib/services/projectService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const project = await getProjectById(id)
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, data: project })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = authenticate(req)
  if (error) return error

  const { id } = await params
  try {
    const body = await req.json()
    const project = await updateProject(id, body)
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, data: project })
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = authenticate(req)
  if (error) return error

  const { id } = await params
  try {
    const project = await deleteProject(id)
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
