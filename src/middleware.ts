import { NextRequest, NextResponse } from 'next/server'

// Routes that require authentication (server-side check via JWT cookie)
const protectedRoutes = ['/dashboard', '/bookmarks', '/settings']

// Routes that should redirect to home if already authenticated
const guestOnlyRoutes = ['/login', '/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('buildfolio_token')?.value

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  if (isProtected && !token) {
    // No token → redirect to login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtected && token) {
    // Structural JWT check (3 dot-separated parts).
    // Full verification happens in authMiddleware.ts on API routes.
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect already-logged-in users away from guest pages
  const isGuestOnly = guestOnlyRoutes.some((route) =>
    pathname.startsWith(route),
  )
  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookmarks/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
}
