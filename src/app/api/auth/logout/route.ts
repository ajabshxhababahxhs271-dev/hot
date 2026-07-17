import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303)
  response.cookies.set({ name: AUTH_COOKIE_NAME, value: '', expires: new Date(0), httpOnly: true, path: '/' })
  return response
}

export async function POST(request: Request) {
  return GET(request)
}
