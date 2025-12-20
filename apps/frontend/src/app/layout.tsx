import 'modern-normalize/modern-normalize.css'

import type { Metadata } from 'next'
import React from 'react'

import { QueryProvider } from './providers/QueryProvider.js'
import { SessionProvider } from './providers/SessionProvider.js'
import ThemeRegistry from './ThemeRegistry.js'

export const metadata: Metadata = {
  title: 'Level 2 Gym',
  description: 'A monorepo built with PNPM and Turborepo',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <QueryProvider>
            <ThemeRegistry>{children}</ThemeRegistry>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
