export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAllProjects, createProject } from '@/lib/services/projectService'
import { authenticate } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const sort = searchParams.get('sort') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const result = await getAllProjects({ search, category, sort, page, limit })
    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = authenticate(req)
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
      category_id,
    } = body

    if (!title || !slug || !description) {
      return NextResponse.json(
        {
          success: false,
          message: 'title, slug, and description are required',
        },
        { status: 400 },
      )
    }

    // Use user_id from JWT token, not from request body
    const project = await createProject({
      title,
      slug,
      description,
      thumbnail,
      github_url,
      live_url,
      user_id: user!.id,
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
        { success: false, message: 'Invalid category_id' },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
