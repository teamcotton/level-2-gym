'use client'

import {
  GitHub as GitHubIcon,
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
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
import { useRouter } from 'next/navigation.js'
import React, { useState } from 'react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev)
  }

  // Helper function to check if error should be displayed at alert level
  const isAlertLevelEmailError = (errorMessage: string | undefined): boolean => {
    if (!errorMessage) return false
    return (
      errorMessage.includes('already registered') ||
      errorMessage.includes('Registration failed') ||
      errorMessage.includes('unexpected error')
    )
  }

  // Helper function to check if error should be displayed at field level
  const isFieldLevelEmailError = (errorMessage: string | undefined): boolean => {
    return !!errorMessage && !isAlertLevelEmailError(errorMessage)
  }

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

          {isAlertLevelEmailError(errors.email) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.email}
            </Alert>
          )}

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
              error={isFieldLevelEmailError(errors.email)}
              helperText={isFieldLevelEmailError(errors.email) ? errors.email : ''}
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
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={onFieldChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              required
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={onFieldChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              required
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
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
