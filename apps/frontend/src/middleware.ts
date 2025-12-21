import { NextResponse } from 'next/server.js'
import { getToken } from 'next-auth/jwt'

import { AUTH_ROUTES, PROTECTED_ROUTES } from './lib/routes.js'

/**
 * Next.js Middleware for route protection and authentication checks
 *
 * Handles authentication verification for protected routes before they're rendered.
 * Redirects unauthenticated users to the login page and prevents authenticated
 * users from accessing auth pages.
 *
 * Protected Routes:
 * - `/admin/*` - Requires authentication, admin role check handled by page components
 * - `/dashboard/*` - Requires authentication
 * - `/profile/*` - Requires authentication
 *
 * Public Routes:
 * - `/login` - Redirects to `/admin` if already authenticated
 * - `/register` - Redirects to `/admin` if already authenticated
 * - All other routes are public
 *
 * Authentication Flow:
 * 1. Check if route requires protection
 * 2. Verify JWT token from cookies using next-auth
 * 3. Redirect unauthenticated users to `/login`
 * 4. Redirect authenticated users away from auth pages
 * 5. Allow access if authenticated or route is public
 *
 * @param request - The incoming request object
 * @returns Response object (redirect or next)
 *
 * @example
 * ```typescript
 * // This middleware automatically protects routes matching the config.matcher
 * // No explicit usage needed - Next.js invokes it automatically
 * ```
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware|Next.js Middleware Docs}
 * @see {@link https://next-auth.js.org/configuration/nextjs#in-middleware|NextAuth Middleware}
 */
export async function middleware(request: Request) {
  const url = new URL(request.url)
  const { pathname } = url

  // Get token from cookies using next-auth
  const token = await getToken({
    req: request as never,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuthenticated = !!token

  const pathMatchesRoute = (route: string) => pathname === route || pathname.startsWith(`${route}/`)
  // Check if current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(pathMatchesRoute)
  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some(pathMatchesRoute)

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    // Add callback URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl, 302)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url), 302)
  }

  // Allow request to proceed to Next.js
  return NextResponse.next()
}

/**
 * Middleware matcher configuration
 *
 * Specifies which routes should be processed by the middleware.
 * Uses glob patterns to match multiple routes efficiently.
 *
 * Matched Routes:
 * - `/admin/:path*` - All admin pages and sub-routes
 * - `/dashboard/:path*` - All dashboard pages
 * - `/profile/:path*` - All profile pages
 * - `/login` - Login page
 * - `/register` - Registration page
 *
 * Excluded Routes:
 * - Static files (`/_next/static/*`)
 * - Image optimization (`/_next/image/*`)
 * - Favicon and public files (`/favicon.ico`, etc.)
 * - API routes (`/api/*`) - Handled by Server Actions
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher|Matcher Config Docs}
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
