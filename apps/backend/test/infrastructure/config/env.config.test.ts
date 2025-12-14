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

    it('should not throw error when all required variables including RESEND_API_KEY are present', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test_google_key'
      process.env.MODEL_NAME = 'gemini-pro'
      process.env.RESEND_API_KEY = 'test_resend_key'

      vi.resetModules()
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(() => EnvConfig.validate()).not.toThrow()
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

    it('should have static validate method accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
    })
  })
})
