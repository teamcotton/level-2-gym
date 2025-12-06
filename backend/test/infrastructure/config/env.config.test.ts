import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('EnvConfig', () => {
  let originalEnv: NodeJS.ProcessEnv

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
    it('should use DATABASE_URL from environment when set', async () => {
      const testUrl = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_URL = testUrl

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.DATABASE_URL).toBe(testUrl)
    })

    it('should default to empty string when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(EnvConfig.DATABASE_URL).toBe('')
    })

    it('should be a static property', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'DATABASE_URL')
      expect(descriptor).toBeDefined()
      expect(descriptor?.configurable).toBe(true)
      expect(descriptor?.enumerable).toBe(true)
    })
  })

  describe('validate()', () => {
    it('should not throw error when DATABASE_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(() => EnvConfig.validate()).not.toThrow()
    })

    it('should throw error when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(() => EnvConfig.validate()).toThrow()
    })

    it('should throw error when DATABASE_URL is empty string', async () => {
      process.env.DATABASE_URL = ''

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(() => EnvConfig.validate()).toThrow()
    })

    it('should throw error with proper message format when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL

      const { EnvConfig } = await import('../../../src/infrastructure/config/env.config.js')

      expect(() => EnvConfig.validate()).toThrow('Missing required environment variables: DATABASE_URL')
    })

    it('should be a static method accessible without instantiation', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

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
