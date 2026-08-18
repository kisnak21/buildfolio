import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/db'

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

/**
 * Admin gate: verifies the JWT AND checks the role against the database
 * (1 query/request, instant revocation, never trusts the claim alone).
 * Returns 403 for non-admins, 401 for unauthenticated.
 */
export const requireAdmin = async (req: NextRequest) => {
  const { user, error } = authenticate(req)
  if (error || !user) return { admin: null, error }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
    if (!dbUser || dbUser.role !== 'admin') {
      return {
        admin: null,
        error: NextResponse.json(
          { success: false, message: 'Admin access required' },
          { status: 403 },
        ),
      }
    }
    return { admin: { ...user, role: dbUser.role }, error: null }
  } catch {
    return {
      admin: null,
      error: NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 },
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
