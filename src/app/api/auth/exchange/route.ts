import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { signToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!nextAuthToken?.email || !nextAuthToken?.name || !nextAuthToken?.localId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
  }

  const appToken = signToken({
    id: nextAuthToken.localId as string,
    email: nextAuthToken.email as string,
    name: nextAuthToken.name as string,
  })

  const response = NextResponse.json({
    success: true,
    token: appToken,
    user: {
      id: nextAuthToken.localId,
      email: nextAuthToken.email,
      name: nextAuthToken.name,
    },
  })

  response.cookies.set('buildfolio_token', appToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
