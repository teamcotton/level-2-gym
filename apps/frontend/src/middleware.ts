import { NextResponse } from 'next/server.js'
import { getToken } from 'next-auth/jwt'

import { AUTH_ROUTES, PROTECTED_ROUTES } from './shared/constants/routes.js'

// In-memory sliding-window rate limiter (hybrid keying: user-id when available, else IP)
const DEFAULT_RATE_LIMIT_WINDOW = 10 // seconds
const DEFAULT_RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW =
  Number.isFinite(Number(process.env.RATE_LIMIT_WINDOW)) &&
  Number(process.env.RATE_LIMIT_WINDOW) > 0
    ? Number(process.env.RATE_LIMIT_WINDOW)
    : DEFAULT_RATE_LIMIT_WINDOW
const RATE_LIMIT_MAX =
  Number.isFinite(Number(process.env.RATE_LIMIT_MAX)) && Number(process.env.RATE_LIMIT_MAX) > 0
    ? Number(process.env.RATE_LIMIT_MAX)
    : DEFAULT_RATE_LIMIT_MAX
const rateMap = new Map<string, number[]>()

// Trusted proxy IPs for secure X-Forwarded-For validation
// Parse comma-separated list from environment variable, default to localhost if not set
const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES
  ? process.env.TRUSTED_PROXIES.split(',').map((ip) => ip.trim())
  : ['127.0.0.1', '::1']

// Periodic cleanup to prevent unbounded growth of `rateMap`.
// This job:
// - Prunes timestamps older than the current sliding window.
// - Removes keys whose timestamp arrays become empty.
const RATE_LIMIT_CLEANUP_INTERVAL_SECONDS = RATE_LIMIT_WINDOW * 2
// Use a self-rescheduling `setTimeout` instead of `setInterval` to avoid
// synchronous module-level intervals, which can be problematic in some
// serverless/edge runtimes.
// Avoid casting to `any` to satisfy `@typescript-eslint/no-explicit-any`.
type TimerWithUnref = { unref?: () => void }

let rateMapCleanupTimer: TimerWithUnref | undefined

export function scheduleRateMapCleanup() {
  const timer = setTimeout(() => {
    const cutoff = nowSeconds() - RATE_LIMIT_WINDOW
    for (const [key, timestamps] of rateMap) {
      const filtered = timestamps.filter((ts) => ts > cutoff)
      if (filtered.length === 0) {
        rateMap.delete(key)
      } else if (filtered.length !== timestamps.length) {
        rateMap.set(key, filtered)
      }
    }

    // Reschedule the next cleanup run.
    scheduleRateMapCleanup()
  }, RATE_LIMIT_CLEANUP_INTERVAL_SECONDS * 1000) as unknown as TimerWithUnref

  // In Node.js environments, avoid keeping the event loop alive solely for cleanup.
  // `unref` is not available in all runtimes (e.g. some edge runtimes), so guard it.
  // `unref` may not exist in all runtimes (edge, workers). Call it only when
  // available to avoid runtime errors and ESLint warnings about unexpected
  // expressions.
  if (typeof timer.unref === 'function') {
    timer.unref()
  }

  rateMapCleanupTimer = timer
}

// Stop the periodic cleanup (test helper). Clears any scheduled timer so tests
// can control lifecycle and avoid cross-test interference.
export function __stopRateMapCleanup() {
  if (rateMapCleanupTimer) {
    try {
      clearTimeout(rateMapCleanupTimer as unknown as ReturnType<typeof setTimeout>)
    } catch {
      // ignore any runtime differences
    }
    rateMapCleanupTimer = undefined
  }
}

// Start the periodic cleanup loop when the module is loaded.
scheduleRateMapCleanup()
/**
 * Reset the in-memory rate limiter state.
 *
 * This helper clears the internal `rateMap` used by the in-process
 * sliding-window rate limiter. It is intended for use in tests to provide a
 * deterministic starting state between test cases. Do NOT use this in
 * production code to coordinate rate-limiting across multiple instances.
 *
 *  @returns {number} The size of the rate limiter map after reset.
 */
export function __resetRateLimiter() {
  rateMap.clear()
}

/**
 * Get the current size of the rate limiter map.
 *
 * This helper returns the number of keys currently stored in the internal
 * `rateMap`. It is intended for use in tests to verify memory cleanup
 * behavior. Do NOT use this in production code.
 *
 * @returns {number} The number of keys in the rate limiter map.
 */
export function __getRateLimiterSize() {
  return rateMap.size
}

/**
 * Return the current time in whole seconds since the UNIX epoch.
 *
 * This is a small helper used by the in-memory rate limiter to compare and
 * expire timestamps. It intentionally floors milliseconds to whole seconds to
 * simplify window calculations.
 *
 * @returns {number} Current epoch time in seconds (integer).
 */
export function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

/**
 * Securely extract the client IP address from request headers.
 *
 * Security considerations:
 * - Searches the X-Forwarded-For header chain for the rightmost IP that isn't in the trusted proxy list
 * - Falls back to X-Real-IP, then 'unknown' if no trusted source is available
 *
 * This prevents attackers from spoofing the X-Forwarded-For header to bypass
 * rate limiting when the application is accessed directly (not through a proxy).
 * When behind trusted proxies, this function identifies the real client IP by
 * finding the rightmost IP in the chain that isn't a known proxy.
 *
 * @param {Request} request - The incoming request object
 * @returns {string} The client IP address or 'unknown'
 */
export function extractClientIp(request: Request): string {
  // Get the X-Forwarded-For header
  const xForwardedFor = request.headers.get('x-forwarded-for')

  if (xForwardedFor) {
    // Parse the X-Forwarded-For header (format: "client, proxy1, proxy2")
    const ips = xForwardedFor
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)

    // Find the rightmost IP that is NOT a trusted proxy
    // This represents the real client IP when behind trusted proxies
    // Iterate from right to left
    for (let i = ips.length - 1; i >= 0; i--) {
      // eslint-disable-next-line security/detect-object-injection
      const ip = ips[i]
      if (ip && !TRUSTED_PROXIES.includes(ip)) {
        return ip
      }
    }
  }

  // Fall back to X-Real-IP or 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Check and update the in-memory sliding-window rate limiter for a given key.
 *
 * Behavior:
 * - Uses a sliding window of `RATE_LIMIT_WINDOW` seconds and allows up to
 *   `RATE_LIMIT_MAX` requests within that window.
 * - Prunes stale timestamps older than the window start, then either rejects
 *   the request (when the limit is reached) or records the current timestamp
 *   and returns allowance information.
 *
 * Keying:
 * - The `key` is typically a hybrid identifier: when available it should be a
 *   user-scoped key (e.g. `user:<id>:<pathname>`), otherwise an IP-scoped key
 *   (e.g. `ip:<addr>:<pathname>`).
 *
 * @param {string} key - Unique key to rate-limit (user-id or IP + route).
 * @returns {{ success: boolean; limit: number; remaining: number; resetAfter: number }}
 *   - `success`: whether the request is allowed.
 *   - `limit`: maximum requests in the configured window.
 *   - `remaining`: remaining requests available for this window.
 *   - `resetAfter`: seconds until the rate window will allow at least one more request.
 */
export function checkAndUpdateRate(key: string) {
  const now = nowSeconds()
  const windowStart = now - RATE_LIMIT_WINDOW
  const arr = rateMap.get(key) ?? []
  // remove old timestamps
  const filtered = arr.filter((ts) => ts > windowStart)
  const count = filtered.length
  if (count >= RATE_LIMIT_MAX) {
    // compute resetAfter (seconds until oldest timestamp expires)
    const oldest = filtered[0] ?? now
    const resetAfter = Math.max(0, RATE_LIMIT_WINDOW - (now - oldest))
    // store back the filtered array (unchanged)
    rateMap.set(key, filtered)
    return { success: false, limit: RATE_LIMIT_MAX, remaining: 0, resetAfter }
  }

  // Clean up memory: if all timestamps have expired, remove the key
  if (filtered.length === 0) {
    rateMap.delete(key)
  }

  // allow request: add current timestamp
  filtered.push(now)
  rateMap.set(key, filtered)
  const remaining = Math.max(0, RATE_LIMIT_MAX - filtered.length)
  const oldest = filtered[0]
  const resetAfter = Math.max(0, RATE_LIMIT_WINDOW - (now - (oldest ?? now)))
  return { success: true, limit: RATE_LIMIT_MAX, remaining, resetAfter }
}

/**
 * Helper function to apply rate-limit headers to a response.
 *
 * Takes the result from the rate limiter and attaches the standard
 * `X-RateLimit-*` headers to the provided response object.
 *
 * @param {import('next/server').NextResponse} response - The response to attach headers to.
 * @param {{ limit: number; remaining: number; resetAfter: number }} rl - Rate limit result.
 * @returns {import('next/server').NextResponse} The response with headers attached.
 */
function attachRateLimitHeaders(
  response: NextResponse,
  rl: { limit: number; remaining: number; resetAfter: number }
) {
  const reset = Math.floor(nowSeconds() + rl.resetAfter)
  response.headers.set('X-RateLimit-Limit', String(rl.limit))
  response.headers.set('X-RateLimit-Remaining', String(rl.remaining))
  response.headers.set('X-RateLimit-Reset', String(reset))
  return response
}

/**
 * Next.js middleware that enforces authentication and rate limiting.
 *
 * Responsibilities:
 * - Authenticate requests using `next-auth`'s `getToken` (reads cookie JWT).
 * - Apply an in-process sliding-window rate limiter to API routes and POST
 *   requests (server actions). Rate-limiting uses hybrid keying (user-id when
 *   available, otherwise client IP) and attaches the standard `X-RateLimit-*`
 *   headers to responses and redirects.
 * - Redirect unauthenticated users away from protected routes to `/login` with
 *   a `callbackUrl` query parameter.
 * - Redirect authenticated users away from auth routes (e.g. `/login`) to
 *   `/admin`.
 *
 * Notes:
 * - This middleware uses `NextResponse.next()` so rendering continues when the
 *   request is allowed. When the rate limit is exceeded it returns a 429
 *   response. Rate-limit headers are attached directly to each response to
 *   avoid race conditions from shared mutable state.
 *
 * @param {Request} request - The incoming Fetch API Request from Next.js.
 * @returns {Promise<import('next/server').NextResponse>} a NextResponse allowing,
 *   redirecting, or rejecting the request.
 */
export async function middleware(request: Request) {
  const url = new URL(request.url)
  const { pathname } = url

  // Authenticate using next-auth token in cookies
  // TypeScript workaround: next-auth's getToken expects a NextRequest/NextApiRequest-like type,
  // but in middleware we receive the native Fetch API Request. We intentionally cast to never here
  // to bypass this type mismatch, as documented in the middleware README and NextAuth docs.
  const token = await getToken({ req: request as never, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  const pathMatchesRoute = (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  const isProtectedRoute = PROTECTED_ROUTES.some(pathMatchesRoute)
  const isAuthRoute = AUTH_ROUTES.some(pathMatchesRoute)

  // Rate limiting: apply to API routes and POST requests (server actions)
  const isApiRoute = pathname.startsWith('/api')
  const isAction = request.method === 'POST'

  // Store rate limit result to attach headers to all responses
  let rateLimitResult: { limit: number; remaining: number; resetAfter: number } | null = null

  if (isApiRoute || isAction) {
    const ip = extractClientIp(request)
    type TokenLike = { sub?: string; id?: string } | undefined
    const tokenLike = token as TokenLike
    const userId = tokenLike?.sub ?? tokenLike?.id
    const key = userId ? `user:${String(userId)}:${pathname}` : `ip:${ip}:${pathname}`

    const rl = checkAndUpdateRate(key)
    rateLimitResult = { limit: rl.limit, remaining: rl.remaining, resetAfter: rl.resetAfter }

    if (!rl.success) {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(rl.limit))
      headers.set('X-RateLimit-Remaining', String(rl.remaining))
      headers.set('X-RateLimit-Reset', String(Math.floor(nowSeconds() + rl.resetAfter)))
      return new NextResponse('Too Many Requests', { status: 429, headers })
    }
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/signin', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const resp = NextResponse.redirect(loginUrl, 302)
    if (rateLimitResult) {
      attachRateLimitHeaders(resp, rateLimitResult)
    }
    return resp
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const resp = NextResponse.redirect(new URL('/admin', request.url), 302)
    if (rateLimitResult) {
      attachRateLimitHeaders(resp, rateLimitResult)
    }
    return resp
  }

  // Allow request to proceed to Next.js
  const resp = NextResponse.next()
  if (rateLimitResult) {
    attachRateLimitHeaders(resp, rateLimitResult)
  }
  return resp
}

/**
 * Next.js middleware configuration.
 *
 * `matcher` defines which routes the middleware will run for. This pattern
 * excludes Next.js static assets, the internal `_next` image handler, and
 * common static file extensions (icons and image formats).
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*[.](?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
