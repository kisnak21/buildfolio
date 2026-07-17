import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/bookmarks', '/settings']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  if (isProtected) {
    const user = req.cookies.get('buildfolio_user')
    if (!user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/bookmarks/:path*', '/settings/:path*'],
}
