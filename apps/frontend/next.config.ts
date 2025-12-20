import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  reactStrictMode: true,
  // Optimize for production
  poweredByHeader: false,
  // Configure image optimization if needed
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Set the workspace root for turbopack
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
}

export default nextConfig
