'use client'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ChatIcon from '@mui/icons-material/Chat'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Typography,
} from '@mui/material'

interface DashboardProps {
  canAccessAdmin: boolean
  onNavigate: (path: string) => void
  onSignOut: () => void
}

/**
 * Dashboard presentational component.
 * Displays navigation cards for Chat, Profile, and Admin (role-based) pages.
 *
 * This is a "dumb" component that receives all data and callbacks via props.
 * No business logic should be in this component.
 *
 * @param {DashboardProps} props - Component properties
 * @param {boolean} props.canAccessAdmin - Whether the user can access the admin page
 * @param {(path: string) => void} props.onNavigate - Callback to navigate to a specific path
 * @param {() => void} props.onSignOut - Callback to handle sign out
 *
 * @example
 * ```tsx
 * <Dashboard
 *   canAccessAdmin={true}
 *   onNavigate={(path) => router.push(path)}
 *   onSignOut={() => router.push('/api/auth/signout')}
 * />
 * ```
 */
export function Dashboard({ canAccessAdmin, onNavigate, onSignOut }: DashboardProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={onSignOut}
          sx={{ textTransform: 'none' }}
        >
          Sign Out
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 4,
        }}
      >
        {/* Chat Card */}
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardActionArea data-testid="chat" sx={{ flexGrow: 1 }} onClick={() => onNavigate('/ai')}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                textAlign: 'center',
              }}
            >
              <ChatIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Chat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a conversation with AI
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Profile Card */}
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardActionArea sx={{ flexGrow: 1 }} onClick={() => onNavigate('/profile')}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
                textAlign: 'center',
              }}
            >
              <PersonIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and edit your profile
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Admin Card - Only visible to admin/moderator */}
        {canAccessAdmin && (
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea sx={{ flexGrow: 1 }} onClick={() => onNavigate('/admin')}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  textAlign: 'center',
                }}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Admin
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage users and settings
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        )}
      </Box>
    </Container>
  )
}
