import type { Session, User as NextAuthUser } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock next-auth types
vi.mock('next-auth', () => ({
  default: vi.fn(),
}))

describe('authOptions Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // Set backend URL for tests
    process.env.BACKEND_AI_CALLBACK_URL = 'http://localhost:3000'
    // Set OAuth sync secret for tests
    process.env.OAUTH_SYNC_SECRET = 'test-secret-key'
    // Reset modules to get fresh config
    vi.resetModules()
  })

  // Import after mocks are set up
  const getAuthOptions = async () => {
    const module = await import('@/lib/auth-config.js')
    return module.authOptions
  }

  describe('Configuration Structure', () => {
    it('should have correct session strategy', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('should have 30-day session maxAge', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60)
    })

    it('should have 30-day jwt maxAge', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60)
    })

    it('should have custom pages configured', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.pages?.signIn).toBe('/signin')
      expect(authOptions.pages?.error).toBe('/error')
    })

    it('should have providers configured', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.providers).toHaveLength(2) // Google + Credentials
    })

    it('should have callbacks configured', async () => {
      const authOptions = await getAuthOptions()
      expect(authOptions.callbacks).toBeDefined()
      expect(authOptions.callbacks?.jwt).toBeDefined()
      expect(authOptions.callbacks?.session).toBeDefined()
    })
  })

  describe('CredentialsProvider authorize', () => {
    const getAuthorizeFunction = async () => {
      const authOptions = await getAuthOptions()
      // Credentials provider is now at index 1 (Google is at 0)
      const provider = authOptions.providers[1]
      // @ts-expect-error - accessing internal provider structure
      return provider.options?.authorize
    }

    it('should throw error when credentials are missing', async () => {
      const authorize = await getAuthorizeFunction()

      await expect(authorize(undefined, {})).rejects.toThrow('Missing credentials')
    })

    it('should throw error when email is missing', async () => {
      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: '',
            password: 'password123',
          },
          {}
        )
      ).rejects.toThrow('Missing credentials')
    })

    it('should throw error when password is missing', async () => {
      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: '',
          },
          {}
        )
      ).rejects.toThrow('Missing credentials')
    })

    it('should successfully authenticate with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          access_token: 'mock-jwt-token',
          roles: ['user'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        accessToken: 'mock-jwt-token',
        roles: ['user'],
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!

      expect(url).toContain('/auth/login')
      expect(options.method).toBe('POST')
      expect(options.body).toBe(
        JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        })
      )
      expect(options.headers).toBeInstanceOf(Headers)
      expect(options.headers.get('Content-Type')).toBe('application/json')
    })

    // TODO: Fix test - BACKEND_AI_CALLBACK_URL_DEV is undefined in test environment
    it.todo('should use BACKEND_AI_CALLBACK_URL_DEV environment variable', async () => {
      const customBackendUrl = 'https://api.example.com'
      const originalEnv = process.env.BACKEND_AI_CALLBACK_URL_DEV
      process.env.BACKEND_AI_CALLBACK_URL_DEV = customBackendUrl

      // Re-import with new env var
      vi.resetModules()
      const { authOptions } = await import('@/lib/auth-config.js')
      const provider = authOptions.providers[0]
      // @ts-expect-error - accessing internal provider structure
      const authorize = provider.options?.authorize

      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          access_token: 'token',
          roles: ['user'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(global.fetch).toHaveBeenCalledWith(
        `${customBackendUrl}/auth/login`,
        expect.any(Object)
      )

      process.env.BACKEND_AI_CALLBACK_URL_DEV = originalEnv
    })

    it('should throw error when backend returns error', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
          {}
        )
      ).rejects.toThrow('Invalid credentials')
    })

    it('should throw generic error when backend returns no error message', async () => {
      const mockResponse = {
        success: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
          {}
        )
      ).rejects.toThrow('Authentication failed')
    })

    it('should return null when response lacks access_token', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          roles: ['user'],
          // missing access_token
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toBeNull()
    })

    it('should return null when response data is undefined', async () => {
      const mockResponse = {
        success: true,
        // data is undefined
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toBeNull()
    })

    it('should handle fetch network errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const authorize = await getAuthorizeFunction()

      await expect(
        authorize(
          {
            email: 'test@example.com',
            password: 'password123',
          },
          {}
        )
      ).rejects.toThrow('Network error')

      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication error:',
          method: 'ERROR',
          prefix: '[[auth-config]] ',
        }),
        expect.any(Error)
      )
    })

    it('should handle multiple roles from backend', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'admin@example.com',
          access_token: 'admin-token',
          roles: ['user', 'admin', 'moderator'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'admin@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toEqual({
        id: 'user-123',
        email: 'admin@example.com',
        accessToken: 'admin-token',
        roles: ['user', 'admin', 'moderator'],
      })
    })

    it('should default to empty roles array when roles are missing', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          access_token: 'token',
          // roles missing
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const authorize = await getAuthorizeFunction()

      const result = await authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        accessToken: 'token',
        roles: [],
      })
    })
  })

  describe('signIn Callback', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call OAuth sync for Google provider with correct headers and body', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-sync',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            provider: 'google',
            providerId: 'user-123',
            email: 'google@example.com',
            name: 'Google User',
          }),
        })
      )

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const options = fetchCall[1]
      expect(options.headers).toBeInstanceOf(Headers)
      expect(options.headers.get('Content-Type')).toBe('application/json')
      expect(options.headers.get('X-OAuth-Sync-Secret')).toBe(process.env.OAUTH_SYNC_SECRET)
    })

    it('should not call OAuth sync for credentials provider', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'credentials',
        providerAccountId: 'user-123',
        type: 'credentials' as const,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: undefined,
      })

      expect(result).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not call OAuth sync when profile email is missing', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        name: 'Google User',
        sub: 'google-123',
        // email is missing
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not call OAuth sync when account is missing', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: null,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should allow sign-in even when OAuth sync fails', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Internal server error' }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle network errors gracefully and allow sign-in', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Google User',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should include user name in sync request when available', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        name: 'Test User Name',
        sub: 'google-123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const body = JSON.parse(fetchCall[1].body) as { name?: string }
      expect(body.name).toBe('Test User Name')
    })

    it('should handle OAuth sync without user name', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'google@example.com',
        emailVerified: null,
        accessToken: '',
        roles: [],
      }

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google-123',
        type: 'oauth' as const,
        access_token: 'google-token',
      }

      const mockProfile = {
        email: 'google@example.com',
        sub: 'google-123',
        // name is missing
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await authOptions.callbacks!.signIn!({
        user: mockUser,
        account: mockAccount,
        profile: mockProfile,
      })

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledTimes(1)

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const body = JSON.parse(fetchCall[1].body) as { name?: string }
      expect(body.name).toBeUndefined()
    })
  })

  describe('JWT Callback', () => {
    it('should add user data to token on initial sign in', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        accessToken: 'mock-token',
        roles: ['user'],
      }

      const mockToken = { accessToken: '', id: '', roles: [] } as JWT

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: {
          provider: 'credentials',
          type: 'credentials',
          providerAccountId: 'test-account-id',
        },
        profile: undefined,
      })

      expect(result).toEqual({
        accessToken: 'mock-token',
        id: 'user-123',
        roles: ['user'],
      })
    })

    it('should return token unchanged when user is not provided', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'existing-token',
        id: 'user-456',
        roles: ['admin'],
      }

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario in update trigger
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result).toEqual(mockToken)
    })

    it('should preserve existing token properties when user is not provided', async () => {
      const authOptions = await getAuthOptions()

      const mockToken = {
        accessToken: 'token',
        id: 'user-789',
        roles: ['user'],
        sub: 'user-789',
        iat: 1234567890,
        exp: 1234567890 + 30 * 24 * 60 * 60,
      }

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        // @ts-expect-error - Testing undefined user scenario in update trigger
        user: undefined,
        trigger: 'update',
        session: undefined,
      })

      expect(result).toEqual(mockToken)
    })

    it('should handle user with multiple roles', async () => {
      const authOptions = await getAuthOptions()

      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        accessToken: 'admin-token',
        roles: ['user', 'admin', 'superuser'],
      }

      const mockToken = { accessToken: '', id: '', roles: [] } as JWT

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: {
          provider: 'credentials',
          type: 'credentials',
          providerAccountId: 'test-account-id',
        },
        profile: undefined,
      })

      expect(result.roles).toEqual(['user', 'admin', 'superuser'])
    })
  })

  describe('Session Callback', () => {
    it('should add token data to session', async () => {
      const authOptions = await getAuthOptions()

      const mockSession = {
        user: {
          email: 'test@example.com',
        },
        expires: '2025-12-31',
      }

      const mockToken = {
        accessToken: 'mock-token',
        id: 'user-123',
        roles: ['user'],
      }

      const result = await authOptions.callbacks!.session!({
        session: mockSession as Session,
        token: mockToken as JWT,
        // @ts-expect-error - Testing with custom User type instead of AdapterUser
        user: undefined as unknown as NextAuthUser,
        trigger: 'update',
        newSession: undefined,
      })

      expect((result.user as Session['user'])?.id).toBe('user-123')
      expect((result.user as Session['user'])?.roles).toEqual(['user'])
      expect((result as Session).accessToken).toBe('mock-token')
    })

    it('should preserve existing session properties', async () => {
      const authOptions = await getAuthOptions()

      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        },
        expires: '2025-12-31',
      }

      const mockToken = {
        accessToken: 'token',
        id: 'user-456',
        roles: ['admin'],
      }

      const result = await authOptions.callbacks!.session!({
        session: mockSession as Session,
        token: mockToken as JWT,
        // @ts-expect-error - Testing with custom User type instead of AdapterUser
        user: undefined as unknown as NextAuthUser,
        trigger: 'update',
        newSession: undefined,
      })

      expect(result.user?.email).toBe('test@example.com')
      expect(result.user?.name).toBe('Test User')
      expect(result.user?.image).toBe('https://example.com/avatar.jpg')
      expect(result.expires).toBe('2025-12-31')
    })

    it('should handle multiple roles in token', async () => {
      const authOptions = await getAuthOptions()

      const mockSession = {
        user: {
          email: 'admin@example.com',
        },
        expires: '2025-12-31',
      }

      const mockToken = {
        accessToken: 'admin-token',
        id: 'admin-123',
        roles: ['user', 'admin', 'moderator'],
      }

      const result = await authOptions.callbacks!.session!({
        session: mockSession as Session,
        token: mockToken as JWT,
        // @ts-expect-error - Testing with custom User type instead of AdapterUser
        user: undefined as unknown as NextAuthUser,
        trigger: 'update',
        newSession: undefined,
      })

      expect((result.user as Session['user'])?.roles).toEqual(['user', 'admin', 'moderator'])
    })

    it('should handle token with no roles', async () => {
      const authOptions = await getAuthOptions()

      const mockSession = {
        user: {
          email: 'test@example.com',
        },
        expires: '2025-12-31',
      }

      const mockToken = {
        accessToken: 'token',
        id: 'user-789',
        // roles undefined
      }

      const result = await authOptions.callbacks!.session!({
        session: mockSession as Session,
        token: mockToken as JWT,
        // @ts-expect-error - Testing with custom User type instead of AdapterUser
        user: undefined as unknown as NextAuthUser,
        trigger: 'update',
        newSession: undefined,
      })

      expect((result.user as Session['user'])?.roles).toBeUndefined()
    })

    it('should handle token with no accessToken', async () => {
      const authOptions = await getAuthOptions()

      const mockSession = {
        user: {
          email: 'test@example.com',
        },
        expires: '2025-12-31',
      }

      const mockToken = {
        id: 'user-999',
        roles: ['user'],
        // accessToken undefined
      }

      const result = await authOptions.callbacks!.session!({
        session: mockSession as Session,
        token: mockToken as JWT,
        // @ts-expect-error - Testing with custom User type instead of AdapterUser
        user: undefined as unknown as NextAuthUser,
        trigger: 'update',
        newSession: undefined,
      })

      expect((result as Session).accessToken).toBeUndefined()
    })
  })

  describe('Integration Tests', () => {
    it('should complete full authentication flow', async () => {
      vi.resetModules()
      const { authOptions } = await import('@/lib/auth-config.js')

      // Step 1: Authorize user
      const mockBackendResponse = {
        success: true,
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          access_token: 'backend-jwt-token',
          roles: ['user'],
        },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBackendResponse,
      })

      // Credentials provider is now at index 1 (Google is at 0)
      const provider = authOptions.providers[1] as {
        options: {
          authorize: (
            credentials: Record<string, string>,
            req: unknown
          ) => Promise<NextAuthUser | null>
        }
      }
      const user = await provider.options.authorize(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        {}
      )

      expect(user).toBeDefined()

      // Step 2: JWT callback adds user data to token
      const token = await authOptions.callbacks!.jwt!({
        token: { accessToken: '', id: '', roles: [] } as JWT,
        user: user as NextAuthUser,
        trigger: 'signIn',
        session: undefined,
        account: {
          provider: 'credentials',
          type: 'credentials',
          providerAccountId: 'test-account-id',
        },
        profile: undefined,
      })

      expect(token.accessToken).toBe('backend-jwt-token')
      expect(token.id).toBe('user-123')
      expect(token.roles).toEqual(['user'])

      // Step 3: Session callback adds token data to session
      const session = await authOptions.callbacks!.session!({
        session: {
          user: { email: 'test@example.com' },
          expires: '2025-12-31',
        } as Session,
        token: token as JWT,
        // @ts-expect-error - Testing with custom User type instead of AdapterUser
        user: undefined as unknown as NextAuthUser,
        trigger: 'update',
        newSession: undefined,
      })

      expect((session.user as Session['user'])?.id).toBe('user-123')
      expect((session.user as Session['user'])?.roles).toEqual(['user'])
      expect((session as Session).accessToken).toBe('backend-jwt-token')
    })
  })
})
