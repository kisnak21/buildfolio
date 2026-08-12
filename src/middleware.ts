import { NextRequest, NextResponse } from 'next/server'
import { verifyJwtEdge } from '@/lib/middleware/verifyJwtEdge'

// Routes that require authentication (server-side check via JWT cookie)
const protectedRoutes = ['/dashboard', '/bookmarks', '/settings', '/liked']

// Routes that should redirect to home if already authenticated
const guestOnlyRoutes = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('buildfolio_token')?.value

  const redirectToLogin = () => {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  if (isProtected) {
    if (!token) return redirectToLogin()

    // Full cryptographic verification on the edge
    const payload = await verifyJwtEdge(token)
    if (!payload) return redirectToLogin()
  }

  // Redirect already-logged-in users away from guest pages
  const isGuestOnly = guestOnlyRoutes.some((route) =>
    pathname.startsWith(route),
  )
  if (isGuestOnly && token) {
    const payload = await verifyJwtEdge(token)
    if (payload) return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookmarks/:path*',
    '/settings/:path*',
    '/liked/:path*',
    '/login',
    '/register',
  ],
}
