import { NextRequest, NextResponse } from 'next/server'
import { verifyJwtProxy } from '@/lib/middleware/verifyJwtProxy'
import prisma from '@/lib/db'
import { accountStatus } from '@/lib/visibility'

// Routes that require authentication (server-side check via JWT cookie)
const protectedRoutes = ['/dashboard', '/bookmarks', '/settings', '/liked', '/admin']

// Routes that should redirect to home if already authenticated
const guestOnlyRoutes = ['/login', '/register']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('buildfolio_token')?.value

  const clearSession = (response: NextResponse) => {
    response.cookies.set('buildfolio_token', '', { path: '/', maxAge: 0 })
    response.cookies.set('buildfolio_session', '', { path: '/', maxAge: 0 })
    return response
  }

  const redirectToLogin = (blocked?: 'banned' | 'suspended') => {
    const loginUrl = new URL('/login', req.url)
    if (blocked) loginUrl.searchParams.set('blocked', blocked)
    else loginUrl.searchParams.set('redirect', pathname)
    return clearSession(NextResponse.redirect(loginUrl))
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  if (isProtected) {
    if (!token) return redirectToLogin()

    // Full cryptographic verification before trusting any JWT claim.
    const payload = await verifyJwtProxy(token)
    if (!payload) return redirectToLogin()

    let account
    try {
      account = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { role: true, bannedAt: true, suspendedUntil: true },
      })
    } catch {
      return new NextResponse('Service temporarily unavailable', { status: 503 })
    }
    if (!account) return redirectToLogin()
    const status = accountStatus(account)
    if (status !== 'active') return redirectToLogin(status)

    if (pathname.startsWith('/admin') && account.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Redirect already-logged-in users away from guest pages
  const isGuestOnly = guestOnlyRoutes.some((route) =>
    pathname.startsWith(route),
  )
  if (isGuestOnly && token) {
    const payload = await verifyJwtProxy(token)
    if (!payload) return clearSession(NextResponse.next())
    try {
      const account = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { bannedAt: true, suspendedUntil: true },
      })
      if (!account) return clearSession(NextResponse.next())
      const status = accountStatus(account)
      if (status !== 'active') return clearSession(NextResponse.next())
      return NextResponse.redirect(new URL('/', req.url))
    } catch {
      return new NextResponse('Service temporarily unavailable', { status: 503 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookmarks/:path*',
    '/settings/:path*',
    '/liked/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
