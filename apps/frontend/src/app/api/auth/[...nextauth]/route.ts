import NextAuth from 'next-auth'

import { authOptions } from '@/lib/auth-config.js'

const handler = NextAuth.default(authOptions)

export { handler as GET, handler as POST }
