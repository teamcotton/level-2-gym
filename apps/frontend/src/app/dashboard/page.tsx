import { redirect } from 'next/navigation.js'

import { getAuthSession, hasAnyRole } from '@/lib/auth.js'

import { DashboardPageClient } from './DashboardPageClient.js'

/**
 * Dashboard page with role-based access control.
 * Only users with 'user', 'admin' or 'moderator' roles can access this page.
 * Server Component that checks authentication before rendering.
 */
export default async function DashboardPage() {
  // Check if user has any of the required roles ('user', 'admin' or 'moderator')
  const hasAccess = await hasAnyRole(['user', 'admin', 'moderator'])

  // Redirect to signin if user doesn't have required role
  if (!hasAccess) {
    redirect('/signin?callbackUrl=/dashboard&error=unauthorized')
  }

  // Get user session to pass roles to client component
  const session = await getAuthSession()
  const userRoles = session?.user?.roles || []

  // Render the client component for authenticated users with proper roles
  return <DashboardPageClient userRoles={userRoles} />
}
