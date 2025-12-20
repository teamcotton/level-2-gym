import NextAuth from 'next-auth'

import { authOptions } from '@/lib/auth-config.js'

// @ts-expect-error - NextAuth types issue with App Router
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
