import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, SESSION_TTL_SECONDS, createSessionToken, isAuthConfigured, verifyCredentials } from '@/lib/auth'

export async function POST(request: Request) {
  const formData = await request.formData()
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/')
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (!isAuthConfigured() || !verifyCredentials(username, password)) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url), 303)
  }

  const response = NextResponse.redirect(new URL(safeNext, request.url), 303)
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: await createSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
    expires: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  })
  return response
}
