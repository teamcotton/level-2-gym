import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Norbert's Spark - an AI tooling CRM",
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '76x76', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '60x60', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '57x57', type: 'image/png' },
    ],
  },
}
