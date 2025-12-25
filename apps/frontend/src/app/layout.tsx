import 'modern-normalize/modern-normalize.css'

import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import Loading from './loading.js'
import { QueryProvider } from './providers/QueryProvider.js'
import { SessionProvider } from './providers/SessionProvider.js'
import ThemeRegistry from './ThemeRegistry.js'

export const metadata: Metadata = {
  title: "Norbert's Spark",
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
            <ThemeRegistry>
              <Suspense fallback={<Loading />}>{children}</Suspense>
            </ThemeRegistry>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
