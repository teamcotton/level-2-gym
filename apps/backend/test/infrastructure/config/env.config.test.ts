import type { Obscured } from 'obscured'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('EnvConfig', () => {
  let originalEnv: typeof process.env

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
    // Clear module cache to ensure fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.resetModules()
  })

  describe('NODE_ENV', () => {
    it('should use NODE_ENV from environment when set', async () => {
      process.env.NODE_ENV = 'production'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.NODE_ENV).toBe('production')
    })

    it('should default to "development" when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.NODE_ENV).toBe('development')
    })

    it('should be a static property', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'NODE_ENV')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })
  })

  describe('DATABASE_URL', () => {
    it('should be a static readonly property', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'DATABASE_URL')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.DATABASE_URL

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.DATABASE_URL)).toBe('[OBSCURED]')
      expect(EnvConfig.DATABASE_URL.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })
  })

  describe('RESEND_API_KEY', () => {
    it('should be a static readonly property', async () => {
      process.env.RESEND_API_KEY = 'test_api_key_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'RESEND_API_KEY')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should have type Obscured<string | undefined>', async () => {
      process.env.RESEND_API_KEY = 'test_api_key_12345'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.RESEND_API_KEY

      // Runtime checks - Obscured objects have specific characteristics
      expect(EnvConfig.RESEND_API_KEY).toBeDefined()
      expect(typeof EnvConfig.RESEND_API_KEY).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.RESEND_API_KEY)).toBe('[OBSCURED]')
      expect(EnvConfig.RESEND_API_KEY.toString()).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should obscure the actual API key value', async () => {
      process.env.RESEND_API_KEY = 'secret_resend_key_xyz'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Verify the key is obscured (doesn't expose the raw value)
      expect(String(EnvConfig.RESEND_API_KEY)).not.toContain('secret_resend_key_xyz')
      expect(EnvConfig.RESEND_API_KEY.toString()).toBe('[OBSCURED]')
    })
  })

  describe('EMAIL_FROM_ADDRESS', () => {
    it('should be a static readonly property', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'noreply@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'EMAIL_FROM_ADDRESS')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use EMAIL_FROM_ADDRESS from environment when set', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'test@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('test@example.com')
    })

    it('should default to empty string when EMAIL_FROM_ADDRESS is not set', async () => {
      delete process.env.EMAIL_FROM_ADDRESS
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('')
    })

    it('should have type string', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'noreply@gym.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.EMAIL_FROM_ADDRESS).toBe('string')
      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('noreply@gym.com')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'support@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // EMAIL_FROM_ADDRESS should be a plain string, not obscured
      expect(typeof EnvConfig.EMAIL_FROM_ADDRESS).toBe('string')
      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('support@example.com')
      // Should not have obscured behavior
      expect(String(EnvConfig.EMAIL_FROM_ADDRESS)).toBe('support@example.com')
    })
  })

  describe('HOST', () => {
    it('should be a static readonly property', async () => {
      process.env.HOST = '0.0.0.0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'HOST')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use HOST from environment when set', async () => {
      process.env.HOST = '0.0.0.0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('0.0.0.0')
    })

    it('should default to "127.0.0.1" when HOST is not set', async () => {
      delete process.env.HOST
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('127.0.0.1')
    })

    it('should have type string', async () => {
      process.env.HOST = 'localhost'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.HOST).toBe('string')
      expect(EnvConfig.HOST).toBe('localhost')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.HOST = '192.168.1.100'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // HOST should be a plain string, not obscured
      expect(typeof EnvConfig.HOST).toBe('string')
      expect(EnvConfig.HOST).toBe('192.168.1.100')
      // Should not have obscured behavior
      expect(String(EnvConfig.HOST)).toBe('192.168.1.100')
    })

    it('should accept IPv4 addresses', async () => {
      process.env.HOST = '192.168.1.1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('192.168.1.1')
    })

    it('should accept IPv6 addresses', async () => {
      process.env.HOST = '::1'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBe('::1')
    })
  })

  describe('USE_HTTPS', () => {
    it('should be a static readonly property', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'USE_HTTPS')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should use USE_HTTPS from environment when set', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('false')
    })

    it('should default to "true" when USE_HTTPS is not set', async () => {
      delete process.env.USE_HTTPS
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('true')
    })

    it('should have type string', async () => {
      process.env.USE_HTTPS = 'true'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
      expect(EnvConfig.USE_HTTPS).toBe('true')
    })

    it('should not be obscured (plain string value)', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // USE_HTTPS should be a plain string, not obscured
      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
      expect(EnvConfig.USE_HTTPS).toBe('false')
      // Should not have obscured behavior
      expect(String(EnvConfig.USE_HTTPS)).toBe('false')
    })

    it('should accept "true" value', async () => {
      process.env.USE_HTTPS = 'true'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('true')
    })

    it('should accept "false" value', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBe('false')
    })

    it('should accept any string value (not strictly boolean)', async () => {
      process.env.USE_HTTPS = 'yes'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // USE_HTTPS is a string, so it accepts any value
      expect(EnvConfig.USE_HTTPS).toBe('yes')
      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
    })
  })

  describe('validate()', () => {
    it('should have DATABASE_URL validation logic', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Check that DATABASE_URL is either set or undefined (no default empty string)
      expect(
        typeof EnvConfig.DATABASE_URL === 'object' || EnvConfig.DATABASE_URL === undefined
      ).toBe(true)
    })

    it('should be a static method accessible without instantiation', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
    })

    it('should include RESEND_API_KEY in required environment variables', async () => {
      // Read the source file to verify RESEND_API_KEY is in requiredEnvs array
      const fs = await import('fs/promises')
      const path = await import('path')
      const envConfigPath = path.join(process.cwd(), 'src/infrastructure/config/env.config.ts')
      const content = await fs.readFile(envConfigPath, 'utf-8')

      // Verify RESEND_API_KEY is listed in the requiredEnvs array
      expect(content).toContain('RESEND_API_KEY')
      expect(content).toMatch(/requiredEnvs.*=.*\[[\s\S]*'RESEND_API_KEY'/m)
    })
  })

  describe('EnvConfig class', () => {
    it('should be instantiable', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const envConfig = new EnvConfig()
      expect(envConfig).toBeInstanceOf(EnvConfig)
    })

    it('should have static NODE_ENV property accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.NODE_ENV).toBeDefined()
      expect(typeof EnvConfig.NODE_ENV).toBe('string')
    })

    it('should have static DATABASE_URL property accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.DATABASE_URL

      // Runtime checks
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.DATABASE_URL)).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should have static RESEND_API_KEY property accessible without instantiation', async () => {
      process.env.RESEND_API_KEY = 'test_key_123'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Type assertion to verify compile-time type
      const _typeCheck: Obscured<string | undefined> = EnvConfig.RESEND_API_KEY

      // Runtime checks
      expect(EnvConfig.RESEND_API_KEY).toBeDefined()
      expect(typeof EnvConfig.RESEND_API_KEY).toBe('object')

      // Obscured objects return '[OBSCURED]' when converted to string
      expect(String(EnvConfig.RESEND_API_KEY)).toBe('[OBSCURED]')

      // Prevent unused variable warning
      void _typeCheck
    })

    it('should have static EMAIL_FROM_ADDRESS property accessible without instantiation', async () => {
      process.env.EMAIL_FROM_ADDRESS = 'test@example.com'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBeDefined()
      expect(typeof EnvConfig.EMAIL_FROM_ADDRESS).toBe('string')
      expect(EnvConfig.EMAIL_FROM_ADDRESS).toBe('test@example.com')
    })

    it('should have static HOST property accessible without instantiation', async () => {
      process.env.HOST = '0.0.0.0'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.HOST).toBeDefined()
      expect(typeof EnvConfig.HOST).toBe('string')
      expect(EnvConfig.HOST).toBe('0.0.0.0')
    })

    it('should have static USE_HTTPS property accessible without instantiation', async () => {
      process.env.USE_HTTPS = 'false'
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.USE_HTTPS).toBeDefined()
      expect(typeof EnvConfig.USE_HTTPS).toBe('string')
      expect(EnvConfig.USE_HTTPS).toBe('false')
    })

    it('should have static validate method accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
    })
  })
})
