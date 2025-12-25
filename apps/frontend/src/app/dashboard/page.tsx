import { redirect } from 'next/navigation.js'

import { createLogger } from '@/adapters/secondary/services/logger.service.js'
import { getAuthSession, hasAnyRole } from '@/lib/auth.js'

import { DashboardPageClient } from './DashboardPageClient.js'

const logger = createLogger({ prefix: '[dashboard-page]' })

/**
 * Dashboard page with role-based access control.
 * Only users with 'user', 'admin' or 'moderator' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function DashboardPage() {
  // Get session first for debugging
  const session = await getAuthSession()
  logger.info('[Dashboard] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    roles: session?.user?.roles,
    accessToken: session?.accessToken ? 'present' : 'missing',
  })

  // Check if user has any of the required roles ('user', 'admin' or 'moderator')
  const hasAccess = await hasAnyRole(['user', 'admin', 'moderator'])
  logger.info('[Dashboard] Role check result:', hasAccess)

  // Redirect to signin if user doesn't have required role
  if (!hasAccess) {
    logger.info('[Dashboard] Access denied - redirecting to signin')
    redirect('/signin?callbackUrl=/dashboard&error=unauthorized')
  }

  // Get user session to pass roles to client component
  const userRoles = session?.user?.roles || []

  // Render the client component for authenticated users with proper roles
  return <DashboardPageClient userRoles={userRoles} />
}
