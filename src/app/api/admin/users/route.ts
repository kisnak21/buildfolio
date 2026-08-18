export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import { listAdminUsers, updateAdminUser } from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const data = await listAdminUsers({ search })
    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}

export async function PATCH(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { admin, error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id query param is required' },
        { status: 400 },
      )
    }
    const body = await req.json()
    const { verified, role } = body

    if (role !== undefined && id === admin!.id && role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'You cannot demote yourself' },
        { status: 403 },
      )
    }

    const user = await updateAdminUser(id, { verified, role })
    return NextResponse.json({ success: true, data: user })
  } catch (err: unknown) {
    if (httpError(err).statusCode === 400 || httpError(err).statusCode === 403) {
      return NextResponse.json(
        { success: false, message: httpError(err).message ?? "Request failed" },
        { status: httpError(err).statusCode },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}