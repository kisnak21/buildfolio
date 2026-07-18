import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { signToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const localId = (nextAuthToken as any)?.localId
  if (!nextAuthToken?.email || !nextAuthToken?.name || !localId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
  }

  const appToken = signToken({
    id: localId,
    email: nextAuthToken.email,
    name: nextAuthToken.name,
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set('buildfolio_token', appToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  response.cookies.set('buildfolio_session', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
