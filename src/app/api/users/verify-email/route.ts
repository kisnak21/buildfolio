export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailService } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'
import { signToken } from '@/lib/auth'
import { setAuthCookies } from '@/lib/authCookies'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    const { success, resetInMs } = await rateLimit(`verify-email:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const { searchParams } = new URL(req.url)
    const verificationToken = searchParams.get('token')
    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 },
      )
    }
    const user = await verifyEmailService(verificationToken)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid Verification Token' },
        { status: 400 },
      )
    }
    const authToken = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
    const response = NextResponse.json({
      success: true,
      message: 'Email Verified Successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          bio: user.bio,
          is_verified: user.isVerified,
        },
      },
    })

    setAuthCookies(response, authToken)

    return response
  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
