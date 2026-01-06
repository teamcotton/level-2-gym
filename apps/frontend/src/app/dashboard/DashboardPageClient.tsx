'use client'

import { Dashboard } from '@/view/client-components/Dashboard.js'
import { useDashboard } from '@/view/hooks/useDashboard.js'

interface DashboardPageClientProps {
  userRoles: string[]
}

/**
 * Dashboard page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function DashboardPageClient({ userRoles }: DashboardPageClientProps) {
  const { canAccessAdmin, handleNavigate, handleSignOut, handleTestServerAction } = useDashboard({
    userRoles,
  })

  return (
    <Dashboard
      canAccessAdmin={canAccessAdmin}
      onNavigate={handleNavigate}
      onSignOut={handleSignOut}
      onTestServerAction={handleTestServerAction}
    />
  )
}
