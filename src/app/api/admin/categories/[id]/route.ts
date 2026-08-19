export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, assertSameOrigin } from '@/lib/middleware/authMiddleware'
import {
  renameAdminCategory,
  deleteAdminCategory,
} from '@/lib/services/adminService'
import { dbErrorMessage, errorStatus, httpError } from '@/lib/apiErrors'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  const { error } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  try {
    const { name, icon } = await req.json()
    const category = await renameAdminCategory(id, name, icon)
    return NextResponse.json({ success: true, data: category })
  } catch (err: unknown) {
    if (httpError(err).statusCode === 400) {
      return NextResponse.json(
        { success: false, message: httpError(err).message ?? "Request failed" },
        { status: 400 },
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
  const { error } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  try {
    const result = await deleteAdminCategory(id)
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (err: unknown) {
    if (httpError(err).statusCode === 400) {
      return NextResponse.json(
        { success: false, message: httpError(err).message ?? "Request failed" },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: errorStatus(err) },
    )
  }
}