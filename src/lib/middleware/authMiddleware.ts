import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export const authenticate = (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 },
      ),
    }
  }

  const token = authHeader.split(' ')[1]

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
