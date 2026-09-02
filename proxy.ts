import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Centralized route protection. This is a defense-in-depth layer on top of
// (not a replacement for) the per-action `getSessionUser()` / `requireAdmin()`
// checks already in app/actions/*.ts — those remain the real authority. What
// this buys you: a new route under /dashboard or /admin is protected the
// moment it's added, even if whoever wrote it forgot to paste in the
// redirect boilerplate.
//
// getSessionCookie() is an OPTIMISTIC check — it only confirms a session
// cookie is present and well-formed, not that the session is still valid
// server-side (expired/revoked sessions are still caught downstream by
// auth.api.getSession() in the page/action). That's intentional: it keeps
// this check cheap and lets the real authorization stay where it already was.
// (Note: as of Next.js 16, proxy.ts always runs on the Node.js runtime —
// there's no edge-runtime option to configure here.)
const PROTECTED_PREFIXES = ['/dashboard', '/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!isProtected) return NextResponse.next()

  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
