import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  const session = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (session) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*'] }
