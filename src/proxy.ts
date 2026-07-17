import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, isAuthConfigured, verifySessionToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const destination = new URL('/login', request.url)
  if (!isAuthConfigured()) {
    destination.searchParams.set('error', 'config')
    return NextResponse.redirect(destination)
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (await verifySessionToken(token)) return NextResponse.next()

  destination.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(destination)
}

export const config = {
  matcher: ['/((?!api/auth|api/cron|login|_next/static|_next/image|favicon.ico).*)'],
}
