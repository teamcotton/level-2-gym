'use client'

import { GitHub as GitHubIcon, Google as GoogleIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Container,
  Divider,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation.js'
import React from 'react'

interface SignInFormProps {
  readonly formData: {
    readonly email: string
    readonly password: string
  }
  readonly errors: {
    readonly email: string
    readonly password: string
  }
  readonly onFieldChange: (
    field: 'email' | 'password'
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly onSubmit: (event: React.FormEvent) => void
  readonly onGoogleSignIn: () => void
  readonly onGitHubSignIn: () => void
  readonly isLoading?: boolean
}

export function SignInForm({
  errors,
  formData,
  isLoading = false,
  onFieldChange,
  onGitHubSignIn,
  onGoogleSignIn,
  onSubmit,
}: SignInFormProps) {
  const router = useRouter()

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Welcome back
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in with
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={onGoogleSignIn}
              sx={{
                py: 1.5,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Google
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GitHubIcon />}
              onClick={onGitHubSignIn}
              sx={{
                py: 1.5,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              GitHub
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Or sign in with email
            </Typography>
          </Divider>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={formData.email}
              onChange={onFieldChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              required
              autoComplete="email"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={onFieldChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="current-password"
              sx={{ mb: 1 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <MuiLink
                type="button"
                component="button"
                variant="body2"
                onClick={() => router.push('/forgot-password')}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <MuiLink
                type="button"
                component="button"
                variant="body2"
                onClick={() => router.push('/registration')}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
