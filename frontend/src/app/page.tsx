import { Box, Container, Typography } from '@mui/material'

import SampleComponent from '../components/SampleComponent.js'

export default function Home() {
  return (
    <Container maxWidth="md">
      <Box
        component="main"
        sx={{
          margin: 'auto',
          padding: 2,
          color: 'white',
          fontSize: '20px',
          lineHeight: 1.6,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '4rem',
            fontWeight: 700,
            lineHeight: 1,
            textAlign: 'center',
            marginBottom: 2,
            background: 'linear-gradient(45deg, #646cff, #535bf2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Welcome to Level 2 Gym
        </Typography>

        <Box
          sx={{
            marginBottom: 4,
            border: '1px solid rgba(100, 108, 255, 0.25)',
            background: 'linear-gradient(rgba(100, 108, 255, 0.1), rgba(100, 108, 255, 0.05))',
            padding: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" paragraph>
            This is a monorepo built with PNPM and Turborepo.
          </Typography>
          <Typography variant="body1" paragraph>
            Frontend: Next.js + React + Material UI
          </Typography>
          <Typography variant="body1">
            Features: ESLint, Prettier, Vitest, Playwright, Drizzle, AI SDK
          </Typography>
        </Box>

        <SampleComponent />
      </Box>
    </Container>
  )
}
