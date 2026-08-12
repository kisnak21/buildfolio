export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailService } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

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
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 },
      )
    }
    const user = await verifyEmailService(token)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid Verification Token' },
        { status: 400 },
      )
    }
    return NextResponse.json({
      success: true,
      message: 'Email Verified Successfully',
    })
  } catch (err: any) {
    console.error('VERIFY EMAIL ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }
}
