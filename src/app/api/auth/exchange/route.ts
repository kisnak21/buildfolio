import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { signToken } from '@/lib/auth'
import prisma from '@/lib/db'
import { accountStatus } from '@/lib/visibility'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!nextAuthToken?.email || !nextAuthToken?.name || !nextAuthToken?.localId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: nextAuthToken.localId as string },
    select: { role: true, bannedAt: true, suspendedUntil: true },
  })

  if (!dbUser) {
    return NextResponse.json(
      { success: false, message: 'Account not found' },
      { status: 401 },
    )
  }
  const status = accountStatus(dbUser)
  if (status !== 'active') {
    return NextResponse.json(
      {
        success: false,
        code: status === 'banned' ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED',
        message:
          status === 'banned'
            ? 'This account has been banned.'
            : 'This account is temporarily suspended.',
        ...(status === 'suspended' && {
          suspendedUntil: dbUser.suspendedUntil?.toISOString(),
        }),
      },
      { status: 403 },
    )
  }

  const appToken = signToken({
    id: nextAuthToken.localId as string,
    email: nextAuthToken.email as string,
    name: nextAuthToken.name as string,
    role: dbUser.role,
  })

  const response = NextResponse.json({
    success: true,
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
