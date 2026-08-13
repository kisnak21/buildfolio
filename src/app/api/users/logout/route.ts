export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { assertSameOrigin } from '@/lib/middleware/authMiddleware'

export async function POST(req: NextRequest) {
  const csrfError = assertSameOrigin(req)
  if (csrfError) return csrfError

  const response = NextResponse.json({ success: true, message: 'Logged out' })

  // Clear httpOnly token cookie
  response.cookies.set('buildfolio_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  // Clear session flag cookie
  response.cookies.set('buildfolio_session', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}