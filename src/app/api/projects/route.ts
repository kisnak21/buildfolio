export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAllProjects, createProject } from '@/lib/services/projectService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const sort = searchParams.get('sort') || undefined
    const projects = await getAllProjects({ search, category, sort })
    return NextResponse.json({ success: true, data: projects })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const { error } = authenticate(req)
  if (error) return error

  try {
    const body = await req.json()
    const {
      title,
      slug,
      description,
      thumbnail,
      github_url,
      live_url,
      user_id,
      category_id,
    } = body

    if (!title || !slug || !description || !user_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'title, slug, description, and user_id are required',
        },
        { status: 400 },
      )
    }

    const project = await createProject({
      title,
      slug,
      description,
      thumbnail,
      github_url,
      live_url,
      user_id,
      category_id,
    })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 409 },
      )
    }
    if (err.code === '23503') {
      return NextResponse.json(
        { success: false, message: 'user_id does not exist' },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
