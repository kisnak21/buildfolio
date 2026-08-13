export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAllProjects, createProject } from '@/lib/services/projectService'
import { authenticate, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

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
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { user, error } = authenticate(req)
  if (error) return error

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const { success, resetInMs } = await rateLimit(`create-project:${user!.id}:${ip}`, {
      max: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many project creations. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const body = await req.json()
    const {
      title,
      slug,
      description,
      thumbnail,
      github_url,
      live_url,
      category_id,
      category,
      technologies,
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
      category,
      technologies,
    })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (err: any) {
    if (err.statusCode === 400) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 },
      )
    }
    if (err.code === '23505' || err.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 409 },
      )
    }
    if (err.code === '23503' || err.code === 'P2003') {
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
