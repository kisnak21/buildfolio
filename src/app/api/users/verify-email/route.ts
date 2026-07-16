export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailService } from '@/lib/services/userService'

export async function GET(req: NextRequest) {
  try {
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
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 },
    )
  }
}
