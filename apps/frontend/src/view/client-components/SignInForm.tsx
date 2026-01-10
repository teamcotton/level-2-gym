'use client'

import { Google as GoogleIcon, Visibility, VisibilityOff } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import React from 'react'

import { Logo } from '@/assets/logo.js'

interface SignInFormProps {
  readonly formData: {
    readonly email: string
    readonly password: string
  }
  readonly errors: {
    readonly email: string
    readonly password: string
    readonly general: string
  }
  readonly onFieldChange: (
    field: 'email' | 'password'
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly onSubmit: (event: React.FormEvent) => void
  readonly onGoogleSignIn: () => void
  readonly onForgotPassword: () => void
  readonly onSignUp: () => void
  readonly showPassword: boolean
  readonly togglePasswordVisibility: () => void
  readonly isLoading?: boolean
}

export function SignInForm({
  errors,
  formData,
  isLoading = false,
  onFieldChange,
  onForgotPassword,
  onGoogleSignIn,
  onSignUp,
  onSubmit,
  showPassword,
  togglePasswordVisibility,
}: SignInFormProps) {
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
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              mb: 3,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <span>Norbert&#39;s Spark</span> <Logo width={48} height={48} />
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in with
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              data-testid="google-signin-button"
              startIcon={<GoogleIcon />}
              onClick={onGoogleSignIn}
              sx={{
                width: 300,
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
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Or sign in with email
            </Typography>
          </Divider>

          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

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
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={onFieldChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="current-password"
              sx={{ mb: 1 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <MuiLink
                type="button"
                component="button"
                variant="body2"
                onClick={onForgotPassword}
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
                onClick={onSignUp}
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
