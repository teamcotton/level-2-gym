/**
 * Protected route patterns that require authentication
 * @constant
 */
export const PROTECTED_ROUTES = ['/admin', '/dashboard', '/profile', '/ai', '/ai/:path*']

/**
 * Authentication route patterns that redirect authenticated users
 * @constant
 */
export const AUTH_ROUTES = ['/register', '/signin', '/error']
