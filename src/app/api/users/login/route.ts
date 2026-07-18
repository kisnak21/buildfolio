export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { loginUserService } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'

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

    const response = NextResponse.json({ success: true, data: result })

    // Set httpOnly cookie with JWT token
    response.cookies.set('buildfolio_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Set session flag cookie (non-sensitive, readable by middleware)
    response.cookies.set('buildfolio_session', '1', {
      httpOnly: false, // middleware needs to read this for redirect logic
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
