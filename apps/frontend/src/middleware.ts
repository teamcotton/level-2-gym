import { NextResponse } from 'next/server.js'
import { getToken } from 'next-auth/jwt'

import { AUTH_ROUTES, PROTECTED_ROUTES } from './lib/routes.js'

// Lazy Upstash imports to avoid dev-time failures when env or packages are missing
let _ratelimit: unknown | null = null
async function getRateLimiter() {
  if (_ratelimit) return _ratelimit
  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return null
    const redis = new Redis({ url, token })
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
    })
    _ratelimit = ratelimit
    return _ratelimit
  } catch {
    // ignore - if Upstash import or init fails, we skip rate limiting
    return null
  }
}

export async function middleware(request: Request) {
  const url = new URL(request.url)
  const { pathname } = url

  // Authenticate using next-auth token in cookies
  const token = await getToken({ req: request as never, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  const pathMatchesRoute = (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  const isProtectedRoute = PROTECTED_ROUTES.some(pathMatchesRoute)
  const isAuthRoute = AUTH_ROUTES.some(pathMatchesRoute)

  // Rate limiting: apply to API routes and POST requests (server actions)
  const isApiRoute = pathname.startsWith('/api')
  const isAction = request.method === 'POST'

  if (isApiRoute || isAction) {
    const rl = (await getRateLimiter()) as {
      limit: (key: string) => Promise<unknown>
    } | null
    if (rl) {
      const ip =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const key = `rl:${ip}:${pathname}`
      let res: unknown | null = null
      try {
        // runtime call
        res = await rl.limit(key)
      } catch {
        // ignore runtime limiter errors
        res = null
      }

      if (res) {
        const r = res as {
          success?: boolean
          limit?: number
          remaining?: number
          resetAfter?: number
        }
        const limit = r.limit ?? 10
        const remaining = Math.max(0, r.remaining ?? 0)
        const reset = Math.floor(Date.now() / 1000 + (r.resetAfter ?? 0))
        const headers = new Headers()
        headers.set('X-RateLimit-Limit', String(limit))
        headers.set('X-RateLimit-Remaining', String(remaining))
        headers.set('X-RateLimit-Reset', String(reset))

        if (!r.success) {
          return new NextResponse('Too Many Requests', { status: 429, headers })
        }

        // stash headers to attach to any response we return later in this handler
        Reflect.set(globalThis, '__lastRateLimitHeaders', headers)
      }
    }
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const resp = NextResponse.redirect(loginUrl, 302)
    const h = Reflect.get(globalThis, '__lastRateLimitHeaders') as Headers | undefined
    if (h) {
      h.forEach((v: string, k: string) => resp.headers.set(k, v))
      Reflect.deleteProperty(globalThis, '__lastRateLimitHeaders')
    }
    return resp
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const resp = NextResponse.redirect(new URL('/admin', request.url), 302)
    const h = Reflect.get(globalThis, '__lastRateLimitHeaders') as Headers | undefined
    if (h) {
      h.forEach((v: string, k: string) => resp.headers.set(k, v))
      Reflect.deleteProperty(globalThis, '__lastRateLimitHeaders')
    }
    return resp
  }

  // Allow request to proceed to Next.js
  const resp = NextResponse.next()
  const h = Reflect.get(globalThis, '__lastRateLimitHeaders') as Headers | undefined
  if (h) {
    h.forEach((v: string, k: string) => resp.headers.set(k, v))
    Reflect.deleteProperty(globalThis, '__lastRateLimitHeaders')
  }
  return resp
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
