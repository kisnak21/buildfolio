export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'
import { assertSameOrigin } from '@/lib/middleware/authMiddleware'

const stripHeaderInjection = (value: string) =>
  value.replace(/[\r\n\x00-\x1f]/g, '').trim()

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const { success, resetInMs } = await rateLimit(`contact:${ip}`, {
      max: 3,
      windowMs: 15 * 60 * 1000,
    })

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Too many messages. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
        },
      )
    }

    const { name, email, message } = await req.json()
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'name, email, and message are required' },
        { status: 400 },
      )
    }

    const cleanName = String(name).trim()
    const cleanEmail = String(email).trim()
    const cleanMessage = String(message).trim()

    if (cleanName.length > 100 || cleanEmail.length > 254 || cleanMessage.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Input exceeds maximum allowed length' },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: 'Enter a valid email address' },
        { status: 400 },
      )
    }

    const safeName = stripHeaderInjection(cleanName)
    const safeEmail = stripHeaderInjection(cleanEmail)

    await sendEmail({
      to: process.env.CONTACT_RECIPIENT_EMAIL || 'krisnastya21@gmail.com',
      subject: 'Contact Form: Message from ' + safeName.slice(0, 50),
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${safeName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <p><strong>Email:</strong> ${safeEmail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <p><strong>Message:</strong></p>
        <p>${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      `,
    })
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}