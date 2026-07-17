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
