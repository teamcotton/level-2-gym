'use client'
import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { useState } from 'react'

export default function SampleComponent() {
  const [count, setCount] = useState(0)

  return (
    <Card sx={{ maxWidth: 400, margin: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Material UI Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This is a sample React component demonstrating Material UI integration in the Astro
          project.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setCount(count + 1)}>
            Count: {count}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => setCount(0)}>
            Reset
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
