import type { NextResponse } from 'next/server'

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const setAuthCookies = (response: NextResponse, token: string) => {
  response.cookies.set('buildfolio_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  })
  response.cookies.set('buildfolio_session', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  })
}
