export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  getProjectById,
  updateProject,
  deleteProject,
} from '@/lib/services/projectService'
import { authenticate, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage, errorStatus } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

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
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = authenticate(req)
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const { success, resetInMs } = await rateLimit(`update-project:${user!.id}:${ip}`, {
    max: 30,
    windowMs: 15 * 60 * 1000,
  })
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many project updates. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
      },
    )
  }

  const { id } = await params
  try {
    const existingProject = await getProjectById(id)
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }

    if (existingProject.user_id !== user!.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you do not own this project' },
        { status: 403 },
      )
    }

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
    if (err.code === '23505' || err.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = authenticate(req)
  if (error) return error

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const { success, resetInMs } = await rateLimit(`delete-project:${user!.id}:${ip}`, {
    max: 30,
    windowMs: 15 * 60 * 1000,
  })
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many project deletions. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
      },
    )
  }

  const { id } = await params
  try {
    const existingProject = await getProjectById(id)
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 },
      )
    }

    if (existingProject.user_id !== user!.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: you do not own this project' },
        { status: 403 },
      )
    }

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
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}
