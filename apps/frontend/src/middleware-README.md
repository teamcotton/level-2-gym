# Middleware Documentation

## Overview

Next.js middleware for route protection and authentication checks. This file must be located at `apps/frontend/src/middleware.ts` per Next.js conventions.

## Phase 1 Part 4: Middleware Implementation

✅ **Status**: COMPLETED

### Implementation Details

**File Location**: `apps/frontend/src/middleware.ts`

**Purpose**: Protect routes requiring authentication before pages are rendered.

**Key Features**:

- JWT token verification via `getToken()` from next-auth/jwt
- Protected routes: `/admin/*`, `/dashboard/*`, `/profile/*`
- Auth routes: `/login`, `/register` (redirect if already authenticated)
- Callback URL preservation for post-login redirect

### Protected Routes

Routes requiring authentication:

- `/admin/*` - Admin panel (role checks handled by page components)
- `/dashboard/*` - User dashboard
- `/profile/*` - User profile pages

### Public Routes

Routes redirecting authenticated users:

- `/login` - Redirects to `/admin` if already logged in
- `/register` - Redirects to `/admin` if already logged in

All other routes are public and accessible without authentication.

### Authentication Flow

1. Middleware checks if route requires protection
2. Verifies JWT token from cookies using next-auth
3. Redirects unauthenticated users to `/login` with callback URL
4. Redirects authenticated users away from auth pages
5. Allows access if authenticated or route is public

### Matcher Configuration

````markdown
# Middleware Documentation

## Overview

Next.js middleware for route protection, authentication checks, and in-process rate limiting. Per Next.js conventions this file must remain at `apps/frontend/src/middleware.ts`.

## Phase 1: Middleware + Rate Limiting

✅ **Status**: COMPLETED (authentication + in-memory rate limiter)

### Implementation Details

**File Location**: `apps/frontend/src/middleware.ts`

**Purpose**: Protect routes requiring authentication and apply a simple, in-process rate limiter for API and server-action requests.

**Key Features**:

- JWT token verification via `getToken()` from `next-auth/jwt`
- Protected routes: `/admin/*`, `/dashboard/*`, `/profile/*` (config in `src/lib/routes.js`)
- Auth routes: `/login`, `/register` (redirects authenticated users to `/admin`)
- In-memory sliding-window rate limiter (10 requests per 10 seconds)
- Hybrid keying for the limiter: uses `user:<id>:<pathname>` when authenticated, otherwise `ip:<addr>:<pathname>`
- Rate-limit headers attached to responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Rate-limit results are stored in a local variable and headers are attached to each response (including redirects) via an `attachRateLimitHeaders` helper

### Exports and Test Helpers

The middleware file exports a few helpers intended to support deterministic unit testing:

- `__resetRateLimiter()` — Clears the internal in-memory rate state (test helper).
- `nowSeconds()` — Returns current epoch seconds (used by the limiter).
- `checkAndUpdateRate(key)` — Runs the sliding-window logic and returns `{ success, limit, remaining, resetAfter }`.

These helpers are intentionally exported so unit tests can control timing and assert rate-limiting behaviour.

### Example: calling `checkAndUpdateRate` from tests

Below is a minimal Vitest example that demonstrates importing the helpers (note the `.js` extension for ESM resolution), resetting the limiter state between tests, using fake timers, and asserting the limiter behaviour:

```ts
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { __resetRateLimiter, checkAndUpdateRate } from '../middleware.js'

describe('rate limiter - example', () => {
  beforeEach(() => {
    __resetRateLimiter()
    vi.useFakeTimers()
    // freeze time at a known point
    vi.setSystemTime(Date.now())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('consumes a token and returns remaining', () => {
    const key = 'ip:127.0.0.1:/api/example'
    const res = checkAndUpdateRate(key)
    expect(res.success).toBe(true)
    expect(res.limit).toBe(10)
    expect(res.remaining).toBeGreaterThanOrEqual(0)
  })
})
```

### Matcher Configuration

The middleware runs for application routes and explicitly excludes common static assets and internal `_next` handlers. The `matcher` pattern is defined in the exported `config` object in the file.

## Authentication & TypeScript Notes

Because middleware receives the native Fetch `Request` in some environments, we intentionally accept a `Request` parameter and adapt it for `next-auth`:

```ts
// middleware receives the Fetch Request
export async function middleware(request: Request) {
  // We pass the request to next-auth's getToken using an explicit cast
  // matching our runtime (this is a deliberate, documented workaround).
  const token = await getToken({ req: request as never, secret: process.env.NEXTAUTH_SECRET })
}
```

Note: the code narrows the token shape before accessing `sub`/`id` to satisfy linting/type rules.

## Rate Limiting Behavior

- Window: `RATE_LIMIT_WINDOW = 10` seconds
- Limit: `RATE_LIMIT_MAX = 10` requests per window
- Keying: `user:<id>:<pathname>` when token present, else `ip:<addr>:<pathname>`
- On each request the middleware sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` on the response. When throttled the middleware returns HTTP 429.

Important: This in-memory limiter is process-local and not suitable for multi-instance production deployments. If you require distributed rate limiting, swap the implementation behind an interface (e.g. Redis/Upstash) and provide a backing store.

### Secure IP Extraction

The middleware implements secure IP extraction to prevent rate limit bypass attacks:

- **Trusted Proxy Validation**: Only trusts `X-Forwarded-For` when configured via `TRUSTED_PROXIES` environment variable
- **Rightmost Non-Proxy IP**: Uses the rightmost IP from `X-Forwarded-For` that isn't in the trusted proxy list
- **Fallback Chain**: Falls back to `X-Real-IP` header, then `'unknown'` if no trusted source is available
- **Default Trusted Proxies**: `127.0.0.1,::1` (localhost IPv4 and IPv6)

This prevents attackers from spoofing the `X-Forwarded-For` header to bypass rate limiting when the application is accessed directly (not through a trusted proxy). In production, configure `TRUSTED_PROXIES` with the IP addresses of your load balancers or reverse proxies.

Example production configuration:

```bash
# For AWS ALB or similar
TRUSTED_PROXIES=10.0.0.1,10.0.0.2,172.16.0.0/12
```

## Headers Propagation

To ensure rate-limit headers are included on all responses, including redirects (e.g. unauthenticated -> `/login`), the middleware computes the rate-limit result (via a local `rateLimitResult` variable) and attaches the `X-RateLimit-*` headers directly to the `NextResponse` instance before returning it.

## Testing

Run these commands in the `apps/frontend` workspace:

```bash
pnpm run typecheck    # TypeScript check (tsc --noEmit)
pnpm run lint         # ESLint checks
pnpm run test:unit    # Vitest unit tests
```

Current test status (branch): unit test suite passes locally (example run: `700` tests passing in this workspace).

## Dependency Changes

- Upstash-based implementation was considered earlier in this branch but has been removed.
- This branch uses an in-process limiter and therefore does not require `@upstash/ratelimit` or `@upstash/redis`.

## Related Files

- **Auth Config**: `apps/frontend/src/lib/auth-config.ts` - NextAuth configuration
- **Auth Utilities**: `apps/frontend/src/lib/auth.ts` - Server Action auth helpers
- **Routes**: `apps/frontend/src/lib/routes.js` - Lists `AUTH_ROUTES` and `PROTECTED_ROUTES` used by middleware
- **Middleware Tests**: `apps/frontend/src/test/middleware.test.ts` and `apps/frontend/src/test/middleware.ratelimit.test.ts` - existing middleware tests and rate-limit tests
- **Helper Tests**: `apps/frontend/src/test/middleware.helpers.test.ts` - tests for `nowSeconds` and `checkAndUpdateRate`

## Next Steps

- If you want distributed/global rate limiting, I can:
  - Add an abstraction layer around `checkAndUpdateRate`
  - Implement a Redis-backed adapter (Upstash or self-hosted) and wire it behind an environment toggle
- Optionally add Playwright E2E tests to validate rate limiting behavior across server boundaries.

## References

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [NextAuth Middleware](https://next-auth.js.org/configuration/nextjs#in-middleware)
- [REFACTORING_PLAN.md](../../../REFACTORING_PLAN.md) - Phase 1 guidance
````
