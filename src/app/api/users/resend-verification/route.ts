export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/services/userService'
import { dbErrorMessage } from '@/lib/apiErrors'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    const { email } = await req.json()
    if (!email || typeof email !== 'string' || email.length > 254) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 },
      )
    }

    const { success, resetInMs } = await rateLimit(`resend-verification:${ip}`, { max: 3, windowMs: 15 * 60 * 1000 })
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many verification emails. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const user = await resendVerificationEmail(email)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No unverified account found for this email' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('RESEND VERIFICATION ERROR:', err)
    return NextResponse.json(
      { success: false, message: dbErrorMessage(err) },
      { status: 500 },
    )
  }}
