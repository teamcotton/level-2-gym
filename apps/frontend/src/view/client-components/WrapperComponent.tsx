'use client'
import { Container } from '@mui/material'
import React from 'react'

export const Wrapper = (props: { children: React.ReactNode }) => {
  return (
    <Container
      maxWidth="md"
      sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 4 }}
    >
      {props.children}
    </Container>
  )
}
