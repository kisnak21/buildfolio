import { NextRequest, NextResponse } from 'next/server'
import transporter from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'name, email, and message are required' },
        { status: 400 },
      )
    }
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'admin@buildfolio.dev',
      subject: `Contact Form: Message from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    })
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
