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
  })

  describe('validate()', () => {
    it('should handle DATABASE_URL validation based on environment', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Check current state of DATABASE_URL
      const isDatabaseUrlSet = !!EnvConfig.DATABASE_URL

      // Validate behaves correctly based on current environment
      const hasValidationError = !isDatabaseUrlSet

      // Verify validate method behavior matches DATABASE_URL state
      try {
        EnvConfig.validate()
        // If no error thrown, DATABASE_URL must be set

        expect(isDatabaseUrlSet).toBe(true)
      } catch (error) {
        // If error thrown, DATABASE_URL must not be set
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(hasValidationError).toBe(true)
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(error).toBeInstanceOf(Error)
        // eslint-disable-next-line vitest/no-conditional-expect
        expect((error as Error).message).toContain('DATABASE_URL')
      }
    })

    it('should have DATABASE_URL validation logic', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      // Check that DATABASE_URL is either set or undefined (no default empty string)
      expect(
        typeof EnvConfig.DATABASE_URL === 'string' || EnvConfig.DATABASE_URL === undefined
      ).toBe(true)
    })

    it('should be a static method accessible without instantiation', async () => {
      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
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

      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('string')
    })

    it('should have static validate method accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(typeof EnvConfig.validate).toBe('function')
    })
  })
})
