'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import HomeIcon from '@mui/icons-material/Home'
import { Box, Button, Container, Paper, Typography } from '@mui/material'
import React from 'react'

interface ErrorPageDisplayProps {
  readonly errorCode: string
  readonly errorMessage: string
  readonly onGoBack: () => void
  readonly onGoHome: () => void
}

/**
 * Error page display component.
 * Pure presentational component that displays error information and action buttons.
 *
 * @param {ErrorPageDisplayProps} props - Component properties
 * @param {string} props.errorCode - HTTP error code to display
 * @param {string} props.errorMessage - Error message to display
 * @param {Function} props.onGoBack - Handler for go back button
 * @param {Function} props.onGoHome - Handler for go home button
 */
export function ErrorPageDisplay({
  errorCode,
  errorMessage,
  onGoBack,
  onGoHome,
}: ErrorPageDisplayProps) {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 100,
              color: 'error.main',
              mb: 3,
            }}
          />

          <Typography variant="h1" component="h1" sx={{ mb: 2, fontSize: '4rem', fontWeight: 700 }}>
            {errorCode}
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Oops! Something went wrong
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
          >
            {errorMessage}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={onGoBack}
              sx={{ px: 3, py: 1.5 }}
            >
              Go Back
            </Button>

            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={onGoHome}
              sx={{ px: 3, py: 1.5 }}
            >
              Go Home
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block' }}>
            If this problem persists, please contact support.
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
