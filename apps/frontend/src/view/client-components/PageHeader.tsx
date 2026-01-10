'use client'
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  onNavigateHome: () => void
  onSignOut: () => void
}

/**
 * Reusable page header component.
 * Displays a home icon, page title, and sign out button.
 *
 * This is a presentational component that receives all data and callbacks via props.
 *
 * @param {PageHeaderProps} props - Component properties
 * @param {string} props.title - The page title to display
 * @param {() => void} props.onNavigateHome - Callback to navigate to the home page
 * @param {() => void} props.onSignOut - Callback to handle sign out
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   onNavigateHome={() => router.push('/dashboard')}
 *   onSignOut={() => router.push('/api/auth/signout')}
 * />
 * ```
 */
export function PageHeader({ onNavigateHome, onSignOut, title }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Home">
          <IconButton onClick={onNavigateHome} color="primary" aria-label="Home" size="large">
            <HomeIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Tooltip>
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<LogoutIcon />}
        onClick={onSignOut}
        data-testid="sign-out-button"
        sx={{ textTransform: 'none' }}
      >
        Sign Out
      </Button>
    </Box>
  )
}
