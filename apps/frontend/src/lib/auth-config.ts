import { type NextAuthOptions, type User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { createLogger } from '@/infrastructure/logging/logger.js'

const logger = createLogger({ prefix: '[auth-config]' })

const backendUrl = process.env.BACKEND_AI_CALLBACK_URL

interface BackendLoginResponse {
  success: boolean
  data?: {
    userId: string
    email: string
    access_token: string
    roles: string[]
  }
  error?: string
}

interface CredentialsInput {
  email: string
  password: string
}

/**
 * NextAuth configuration options for authentication
 *
 * Configures authentication using credentials provider with backend API integration.
 * Uses JWT strategy for session management with 30-day expiration.
 *
 * @property {Array} providers - Authentication providers (Credentials)
 * @property {object} callbacks - Custom callbacks for JWT and session handling
 * @property {Function} callbacks.jwt - JWT callback to add custom properties (accessToken, id, roles)
 * @property {Function} callbacks.session - Session callback to expose JWT properties to client
 * @property {object} pages - Custom authentication page routes
 * @property {string} pages.signIn - Sign-in page route (/login)
 * @property {string} pages.error - Error page route (/login)
 * @property {object} session - Session configuration
 * @property {string} session.strategy - Session strategy ('jwt')
 * @property {number} session.maxAge - Session max age in seconds (30 days)
 * @property {object} jwt - JWT configuration
 * @property {number} jwt.maxAge - JWT max age in seconds (30 days)
 * @property {string} secret - Secret key for JWT signing from NEXTAUTH_SECRET env var
 * @property {boolean} debug - Enable debug mode in development
 *
 * @example
 * ```tsx
 * // In your app layout or provider
 * import { authOptions } from '@/lib/auth-config'
 * import { getServerSession } from 'next-auth'
 *
 * const session = await getServerSession(authOptions)
 * ```
 *
 * @see {@link https://next-auth.js.org/configuration/options|NextAuth Options}
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // @ts-expect-error - NextAuth v4 ESM/CommonJS interop issue with credentials provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: CredentialsInput | undefined): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        try {
          // Call backend login endpoint
          console.log(`${backendUrl}/auth/login`)
          const response = await fetch(`${backendUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const result = (await response.json()) as BackendLoginResponse

          if (!response.ok) {
            throw new Error(result.error || 'Authentication failed')
          }

          const data = result.data

          // Backend should return: { userId, email, access_token, roles }
          if (data?.access_token) {
            return {
              id: data.userId,
              email: data.email,
              accessToken: data.access_token,
              roles: data.roles || [],
            } as User
          }

          return null
        } catch (error) {
          logger.error('Authentication error:', error)
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken
        token.id = user.id
        token.roles = user.roles
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = token.roles as string[]
      }
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
