export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getUserById, createUser } from '@/lib/services/userService'
import { authenticate } from '@/lib/middleware/authMiddleware'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const { user, error } = authenticate(req)
    if (error) return error

    const profile = await getUserById(user.id)
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (err: any) {
    console.error('GET USER ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registrations per hour per IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const { success, resetInMs } = await rateLimit(`register:${ip}`, {
      max: 5,
      windowMs: 60 * 60 * 1000,
    })

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many registration attempts. Try again later.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

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
    if (err.statusCode === 400) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 },
      )
    }
    if (err.code === '23505' || err.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
