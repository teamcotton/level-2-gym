import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Database Index', () => {
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

  describe('Pool Configuration', () => {
    it('should create pool with correct configuration when DATABASE_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool).toBeDefined()
      expect(pool.options).toBeDefined()
      expect(pool.options.connectionString).toBeDefined()
    })

    it('should configure SSL as false when DATABASE_SSL_ENABLED is not true', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).toBe(false)
    })

    it('should enable SSL when DATABASE_SSL_ENABLED is true', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'true'
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'true'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).toBeDefined()
      expect(pool.options.ssl).not.toBe(false)
      expect(pool.options.ssl).toMatchObject({ rejectUnauthorized: true })
    })

    it('should set rejectUnauthorized to false when DATABASE_SSL_REJECT_UNAUTHORIZED is false', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'true'
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'false'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).toBeDefined()
      expect(pool.options.ssl).not.toBe(false)
      expect(pool.options.ssl).toMatchObject({ rejectUnauthorized: false })
    })

    it('should enable SSL with rejectUnauthorized true by default when DATABASE_SSL_ENABLED is true', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'true'
      delete process.env.DATABASE_SSL_REJECT_UNAUTHORIZED

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).toBeDefined()
      expect(pool.options.ssl).not.toBe(false)
      expect(pool.options.ssl).toMatchObject({ rejectUnauthorized: true })
    })
  })

  describe('Error Handling', () => {
    it('should throw ValidationException when DATABASE_URL is undefined', async () => {
      process.env.DATABASE_URL = undefined

      await expect(import('../../../src/infrastructure/database/index.js')).rejects.toThrow(
        'DATABASE_URL is required but not configured'
      )
    })
  })

  describe('Drizzle Instance', () => {
    it('should initialize drizzle instance with pool', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { db } = await import('../../../src/infrastructure/database/index.js')

      expect(db).toBeDefined()
      expect(typeof db).toBe('object')
    })

    it('should export both pool and db instances', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const module = await import('../../../src/infrastructure/database/index.js')

      expect(module.pool).toBeDefined()
      expect(module.db).toBeDefined()
    })

    it('should create drizzle instance that is ready to use', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { db } = await import('../../../src/infrastructure/database/index.js')

      // Check that db has expected drizzle methods
      expect(db).toHaveProperty('query')
      expect(db).toHaveProperty('select')
      expect(db).toHaveProperty('insert')
      expect(db).toHaveProperty('update')
      expect(db).toHaveProperty('delete')
    })
  })

  describe('Pool Error Handling', () => {
    it('should attach error handler to pool', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      // Verify that the pool has event listeners attached
      const errorListeners = pool.listeners('error')
      expect(errorListeners.length).toBeGreaterThan(0)
    })
  })

  describe('Environment-specific Configuration', () => {
    it('should use SSL configuration based on environment variables', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.NODE_ENV = 'production'
      process.env.DATABASE_SSL_ENABLED = 'true'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).not.toBe(false)
    })

    it('should handle development environment without SSL', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.NODE_ENV = 'development'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).toBe(false)
    })

    it('should handle test environment without SSL', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      process.env.NODE_ENV = 'test'
      process.env.DATABASE_SSL_ENABLED = 'false'

      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.ssl).toBe(false)
    })

    it('should configure pool with correct timeout and size settings', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb'
      const { pool } = await import('../../../src/infrastructure/database/index.js')

      expect(pool.options.connectionTimeoutMillis).toBe(5000)
      expect(pool.options.idleTimeoutMillis).toBe(30000)
      expect(pool.options.max).toBe(20)
    })
  })
})
