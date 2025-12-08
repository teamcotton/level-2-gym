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

interface RegistrationFormProps {
  readonly formData: {
    readonly email: string
    readonly name: string
    readonly password: string
    readonly confirmPassword: string
  }
  readonly errors: {
    readonly email: string
    readonly name: string
    readonly password: string
    readonly confirmPassword: string
  }
  readonly onFieldChange: (
    field: 'email' | 'name' | 'password' | 'confirmPassword'
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly onSubmit: (event: React.FormEvent) => void
  readonly onGoogleSignUp: () => void
  readonly onGitHubSignUp: () => void
}

export function RegistrationForm({
  errors,
  formData,
  onFieldChange,
  onGitHubSignUp,
  onGoogleSignUp,
  onSubmit,
}: RegistrationFormProps) {
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
            Create your account
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign up with
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={onGoogleSignUp}
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
              onClick={onGitHubSignUp}
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
              Or sign up with email
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
              label="Name"
              type="text"
              value={formData.name}
              onChange={onFieldChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              margin="normal"
              required
              autoComplete="name"
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
              autoComplete="new-password"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm password"
              type="password"
              value={formData.confirmPassword}
              onChange={onFieldChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              required
              autoComplete="new-password"
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Create account
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <MuiLink
                type="button"
                component="button"
                variant="body2"
                onClick={() => router.push('/signin')}
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
                Sign in
              </MuiLink>
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 3, textAlign: 'center' }}
          >
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
