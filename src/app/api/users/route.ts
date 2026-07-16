export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser } from '@/lib/services/userService'

export async function GET() {
  try {
    const users = await getAllUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, image, bio } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'name, email, and password are required' },
        { status: 400 },
      )
    }
    const user = await createUser({ name, email, password, image, bio })
    return NextResponse.json(
      {
        success: true,
        message:
          'Registration successful. Please check your email to verify your account.',
        data: user,
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('REGISTER ERROR:', err)
    if (err.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { success: false, message: err.message, stack: err.stack },
      { status: 500 },
    )
  }
}
