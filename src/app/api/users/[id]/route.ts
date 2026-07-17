export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser, deleteUser } from '@/lib/services/userService'
import { authenticate } from '@/lib/middleware/authMiddleware'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, data: user })
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
    const user = await updateUser(id, body)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, data: user })
  } catch (err: any) {
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
    const user = await deleteUser(id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
