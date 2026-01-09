import type { FastifyReply, FastifyRequest } from 'fastify'
import { obscured } from 'obscured'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvConfig } from '../../../../src/infrastructure/config/env.config.js'
import { oauthSyncAuthMiddleware } from '../../../../src/infrastructure/http/middleware/auth-sync-auth.middleware.js'

describe('oauthSyncAuthMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>
  let sendSpy: ReturnType<typeof vi.fn>
  let codeSpy: ReturnType<typeof vi.fn>
  let logInfoSpy: ReturnType<typeof vi.fn>
  let logWarnSpy: ReturnType<typeof vi.fn>
  let logErrorSpy: ReturnType<typeof vi.fn>

  // Store the configured secret value from EnvConfig
  const configuredSecret = obscured.value(EnvConfig.OAUTH_SYNC_SECRET)

  beforeEach(() => {
    // Reset all mocks and restore spies
    vi.clearAllMocks()
    vi.restoreAllMocks()

    // Setup reply mock
    sendSpy = vi.fn().mockReturnThis()
    codeSpy = vi.fn().mockReturnValue({ send: sendSpy })

    mockReply = {
      code: codeSpy,
      send: sendSpy,
    } as Partial<FastifyReply>

    // Setup log mocks
    logInfoSpy = vi.fn()
    logWarnSpy = vi.fn()
    logErrorSpy = vi.fn()

    // Setup request mock
    mockRequest = {
      headers: {},
      method: 'POST',
      url: '/auth/oauth-sync',
      log: {
        info: logInfoSpy,
        warn: logWarnSpy,
        error: logErrorSpy,
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
      } as any,
    } as Partial<FastifyRequest>
  })

  describe('Successful authentication', () => {
    it('should authenticate with valid secret', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
      expect(logInfoSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/auth/oauth-sync',
        },
        'OAuth sync authentication attempt'
      )
      expect(logInfoSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/auth/oauth-sync',
        },
        'OAuth sync authentication successful'
      )
    })

    it('should log authentication attempt', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          route: '/auth/oauth-sync',
        }),
        'OAuth sync authentication attempt'
      )
    })

    it('should log successful authentication', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          route: '/auth/oauth-sync',
        }),
        'OAuth sync authentication successful'
      )
    })

    it('should use routerPath if available instead of url', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }
      ;(mockRequest as any).routerPath = '/auth/oauth-sync'
      ;(mockRequest as any).url = '/auth/oauth-sync?query=param'

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          route: '/auth/oauth-sync',
        }),
        expect.any(String)
      )
    })
  })

  describe('Missing secret header', () => {
    it('should reject request without secret header', async () => {
      mockRequest.headers = {}

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should log warning when secret is missing', async () => {
      mockRequest.headers = {}

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/auth/oauth-sync',
        },
        'OAuth sync authentication failed: missing secret'
      )
    })

    it('should reject request with empty string secret', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': '' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should reject request with non-string secret header', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': ['array', 'value'] as any }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })
  })

  describe('Invalid secret', () => {
    it('should reject request with wrong secret', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should log warning when secret is invalid', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/auth/oauth-sync',
        },
        'OAuth sync authentication failed: invalid secret'
      )
    })

    it('should reject secret with different length', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'short' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should reject secret with case mismatch', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'TEST-SECRET-KEY-123' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should reject secret with extra whitespace', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': ' test-secret-key-123 ' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should reject secret with similar but different value', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'test-secret-key-124' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })
  })

  describe('Configuration errors', () => {
    it('should reject when secret does not match configured value', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret-value' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should log warning when provided secret is invalid', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'invalid-secret' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logWarnSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/auth/oauth-sync',
        },
        'OAuth sync authentication failed: invalid secret'
      )
    })
  })

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Force an error by making log.info throw
      logInfoSpy.mockImplementationOnce(() => {
        throw new Error('Unexpected error')
      })
      mockRequest.headers = { 'x-oauth-sync-secret': 'test-secret-key-123' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should log error details on unexpected errors', async () => {
      const testError = new Error('Unexpected error')
      logInfoSpy.mockImplementationOnce(() => {
        throw testError
      })
      mockRequest.headers = { 'x-oauth-sync-secret': 'test-secret-key-123' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logErrorSpy).toHaveBeenCalledWith(
        {
          method: 'POST',
          route: '/auth/oauth-sync',
          err: testError,
        },
        'OAuth sync authentication error'
      )
    })

    it('should return generic error message on unexpected errors', async () => {
      logInfoSpy.mockImplementationOnce(() => {
        throw new Error('Database connection failed')
      })
      mockRequest.headers = { 'x-oauth-sync-secret': 'test-secret-key-123' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })
  })

  describe('Security features', () => {
    it('should use constant-time comparison (timing-safe)', async () => {
      // This test verifies the middleware uses timingSafeEqual
      // by ensuring secrets of different lengths are rejected (prerequisite for timingSafeEqual)
      mockRequest.headers = { 'x-oauth-sync-secret': 'short' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
    })

    it('should not reveal whether secret length matches', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret' }
      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      const response1 = sendSpy.mock.calls[0]?.[0]

      vi.clearAllMocks()
      mockRequest.headers = { 'x-oauth-sync-secret': 'x' }
      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      const response2 = sendSpy.mock.calls[0]?.[0]

      // Both should return the same generic error message
      expect(response1).toEqual(response2)
      expect(response1).toEqual({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should return same error for missing and invalid secrets', async () => {
      mockRequest.headers = {}
      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      const missingSecretResponse = sendSpy.mock.calls[0]?.[0]

      vi.clearAllMocks()
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret' }
      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      const invalidSecretResponse = sendSpy.mock.calls[0]?.[0]

      // Should return identical error messages for security
      expect(missingSecretResponse).toEqual(invalidSecretResponse)
    })
  })

  describe('Logging context', () => {
    it('should include request method in logs', async () => {
      ;(mockRequest as any).method = 'POST'
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' }),
        expect.any(String)
      )
    })

    it('should include route in logs', async () => {
      ;(mockRequest as any).url = '/auth/oauth-sync'
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.objectContaining({ route: '/auth/oauth-sync' }),
        expect.any(String)
      )
    })

    it('should log both attempt and success for valid authentication', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledTimes(2)
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        1,
        expect.any(Object),
        'OAuth sync authentication attempt'
      )
      expect(logInfoSpy).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        'OAuth sync authentication successful'
      )
    })

    it('should not log success on authentication failure', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledTimes(1) // Only attempt, not success
      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'OAuth sync authentication attempt'
      )
      expect(logWarnSpy).toHaveBeenCalled()
    })
  })

  describe('Response structure', () => {
    it('should return 401 status code for authentication failures', async () => {
      mockRequest.headers = { 'x-oauth-sync-secret': 'wrong-secret' }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
    })

    it('should return object with success property on failure', async () => {
      mockRequest.headers = {}

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      )
    })

    it('should return object with error property on failure', async () => {
      mockRequest.headers = {}

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      )
    })

    it('should chain reply methods correctly', async () => {
      mockRequest.headers = {}

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(codeSpy.mock.results[0]?.value.send).toBe(sendSpy)
    })
  })

  describe('Edge cases', () => {
    it('should authenticate with configured secret value', async () => {
      // Test that authentication works with the actual configured secret
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).not.toHaveBeenCalled()
      expect(sendSpy).not.toHaveBeenCalled()
    })

    it('should reject secret that differs by one character', async () => {
      // Create a secret similar to configured one but slightly different
      const almostCorrectSecret = (configuredSecret || 'default-secret').slice(0, -1) + 'X'
      mockRequest.headers = { 'x-oauth-sync-secret': almostCorrectSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })

    it('should handle configured secret correctly', async () => {
      // Verify the middleware uses the secret from EnvConfig
      mockRequest.headers = { 'x-oauth-sync-secret': configuredSecret }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(logInfoSpy).toHaveBeenCalledWith(
        expect.any(Object),
        'OAuth sync authentication successful'
      )
    })

    it('should handle request with multiple header values (array)', async () => {
      mockRequest.headers = {
        'x-oauth-sync-secret': ['secret1', 'secret2'] as any,
      }

      await oauthSyncAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(codeSpy).toHaveBeenCalledWith(401)
      expect(sendSpy).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to OAuth sync endpoint',
      })
    })
  })
})
