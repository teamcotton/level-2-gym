import 'modern-normalize/modern-normalize.css'

import type { Metadata } from 'next'

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
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
