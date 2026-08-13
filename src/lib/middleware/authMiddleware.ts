import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export const authenticate = (req: NextRequest) => {
  // Baca JWT dari httpOnly cookie (primary), dari Authorization header (fallback)
  let token: string | null = null

  const cookieToken = req.cookies.get('buildfolio_token')?.value
  if (cookieToken) {
    token = cookieToken
  } else {
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
  }

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 },
      ),
    }
  }

  try {
    const user = verifyToken(token)
    return { user, error: null }
  } catch {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 },
      ),
    }
  }
}

export const assertSameOrigin = (req: NextRequest) => {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  if (!origin && !referer) {
    return null
  }
  const source = origin ?? new URL(referer!).origin
  const host =
    req.headers.get('host') || req.headers.get('x-forwarded-host')
  if (!host) {
    return null
  }
  let sourceHost: string
  try {
    sourceHost = new URL(source).host
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid origin header' },
      { status: 400 },
    )
  }
  if (sourceHost !== host) {
    return NextResponse.json(
      { success: false, message: 'Cross-origin request rejected' },
      { status: 403 },
    )
  }
  return null
}
