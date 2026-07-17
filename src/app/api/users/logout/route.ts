export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function POST() {
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
