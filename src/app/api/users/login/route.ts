export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { loginUserService } from '@/lib/services/userService'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'email and password are required' },
        { status: 400 },
      )
    }
    const result = await loginUserService({ email, password })
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 },
      )
    }
    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
