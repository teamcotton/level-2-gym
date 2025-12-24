'use client'

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ChatIcon from '@mui/icons-material/Chat'
import PersonIcon from '@mui/icons-material/Person'
import { Box, Card, CardActionArea, CardContent, Container, Typography } from '@mui/material'
import { useRouter } from 'next/navigation.js'

interface DashboardPageClientProps {
  userRoles: string[]
}

/**
 * Dashboard page client component.
 * Displays navigation cards for Chat, Profile, and Admin (role-based) pages.
 */
export function DashboardPageClient({ userRoles }: DashboardPageClientProps) {
  const router = useRouter()

  // Check if user has admin or moderator role
  const canAccessAdmin = userRoles.includes('admin') || userRoles.includes('moderator')

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 6 }}>
        Dashboard
      </Typography>

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
        {/* Chat Link */}
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
          <CardActionArea sx={{ flexGrow: 1 }} onClick={() => handleNavigate('/ai')}>
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

        {/* Profile Link */}
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
          <CardActionArea sx={{ flexGrow: 1 }} onClick={() => handleNavigate('/profile')}>
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

        {/* Admin Link - Only visible to admin/moderator */}
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
            <CardActionArea sx={{ flexGrow: 1 }} onClick={() => handleNavigate('/admin')}>
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
