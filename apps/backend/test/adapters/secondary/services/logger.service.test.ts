import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock pino logger at module level
const mockPinoLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

// Mock pino module before tests run
vi.mock('pino', () => ({
  default: vi.fn(() => mockPinoLogger),
}))

describe('PinoLoggerService', () => {
  let originalEnv: typeof process.env

  // Helper function to create a logger service instance
  async function createLoggerService(logLevel?: string) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    if (logLevel !== undefined) {
      process.env.LOG_LEVEL = logLevel
    } else {
      // Ensure LOG_LEVEL is not set to test default behavior
      delete process.env.LOG_LEVEL
    }
    const { PinoLoggerService } =
      await import('../../../../src/adapters/secondary/services/logger.service.js')
    return new PinoLoggerService()
  }

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Clear mock calls
    mockPinoLogger.info.mockClear()
    mockPinoLogger.error.mockClear()
    mockPinoLogger.warn.mockClear()
    mockPinoLogger.debug.mockClear()

    // Clear module cache
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('constructor', () => {
    it('should initialize pino logger with default log level', async () => {
      const pino = (await import('pino')).default
      await createLoggerService()

      expect(pino).toHaveBeenCalledWith({
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      })
    })

    it('should initialize pino logger with custom log level from environment', async () => {
      const pino = (await import('pino')).default
      await createLoggerService('debug')

      expect(pino).toHaveBeenCalledWith({
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      })
    })

    it('should initialize pino logger with pino-pretty transport', async () => {
      const pino = (await import('pino')).default
      await createLoggerService()

      // @ts-ignore
      const call = vi.mocked(pino).mock.calls[0][0] || { transport: null }
      expect(call?.transport).toEqual({
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      })
    })
  })

  describe('LoggerPort interface implementation', () => {
    it('should implement LoggerPort interface', async () => {
      const loggerService = await createLoggerService()

      // Verify all required methods exist
      expect(typeof loggerService.info).toBe('function')
      expect(typeof loggerService.error).toBe('function')
      expect(typeof loggerService.warn).toBe('function')
      expect(typeof loggerService.debug).toBe('function')
    })
  })

  describe('info()', () => {
    it('should call pino info with message only', async () => {
      const loggerService = await createLoggerService()
      loggerService.info('Test info message')

      expect(mockPinoLogger.info).toHaveBeenCalledWith(undefined, 'Test info message')
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1)
    })

    it('should call pino info with message and context', async () => {
      const loggerService = await createLoggerService()
      const context = { userId: '123', action: 'login' }
      loggerService.info('User logged in', context)

      expect(mockPinoLogger.info).toHaveBeenCalledWith(context, 'User logged in')
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1)
    })

    it('should call pino info with empty context object', async () => {
      const loggerService = await createLoggerService()
      loggerService.info('Test message', {})

      expect(mockPinoLogger.info).toHaveBeenCalledWith({}, 'Test message')
    })

    it('should handle complex context objects', async () => {
      const loggerService = await createLoggerService()
      const context = {
        user: { id: '123', name: 'John' },
        metadata: { timestamp: Date.now(), ip: '127.0.0.1' },
        tags: ['auth', 'login'],
      }
      loggerService.info('Complex log', context)

      expect(mockPinoLogger.info).toHaveBeenCalledWith(context, 'Complex log')
    })
  })

  describe('error()', () => {
    it('should call pino error with message only', async () => {
      const loggerService = await createLoggerService()
      loggerService.error('Test error message')

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ err: undefined }, 'Test error message')
      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should call pino error with message and Error object', async () => {
      const loggerService = await createLoggerService()
      const error = new Error('Something went wrong')
      loggerService.error('Error occurred', error)

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ err: error }, 'Error occurred')
      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should call pino error with message, Error object, and context', async () => {
      const loggerService = await createLoggerService()
      const error = new Error('Database connection failed')
      const context = { userId: '123', operation: 'db_query' }
      loggerService.error('Database error', error, context)

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        { ...context, err: error },
        'Database error'
      )
      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1)
    })

    it('should merge context with error object', async () => {
      const loggerService = await createLoggerService()
      const error = new Error('Validation failed')
      const context = { field: 'email', value: 'invalid' }
      loggerService.error('Validation error', error, context)

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        { field: 'email', value: 'invalid', err: error },
        'Validation error'
      )
    })

    it('should handle error without context', async () => {
      const loggerService = await createLoggerService()
      const error = new Error('Network error')
      loggerService.error('Network failure', error, undefined)

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ err: error }, 'Network failure')
    })

    it('should handle Error with stack trace', async () => {
      const loggerService = await createLoggerService()
      const error = new Error('Stack trace test')
      error.stack = 'Error: Stack trace test\n  at test.ts:123:45'
      loggerService.error('Error with stack', error)

      expect(mockPinoLogger.error).toHaveBeenCalledWith({ err: error }, 'Error with stack')
    })
  })

  describe('warn()', () => {
    it('should call pino warn with message only', async () => {
      const loggerService = await createLoggerService()
      loggerService.warn('Test warning message')

      expect(mockPinoLogger.warn).toHaveBeenCalledWith(undefined, 'Test warning message')
      expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1)
    })

    it('should call pino warn with message and context', async () => {
      const loggerService = await createLoggerService()
      const context = { retries: 3, endpoint: '/api/users' }
      loggerService.warn('Retry limit approaching', context)

      expect(mockPinoLogger.warn).toHaveBeenCalledWith(context, 'Retry limit approaching')
      expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1)
    })

    it('should call pino warn with empty context object', async () => {
      const loggerService = await createLoggerService()
      loggerService.warn('Warning message', {})

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({}, 'Warning message')
    })

    it('should handle complex context objects', async () => {
      const loggerService = await createLoggerService()
      const context = {
        performance: { responseTime: 5000, threshold: 3000 },
        request: { method: 'GET', path: '/api/slow' },
      }
      loggerService.warn('Slow request detected', context)

      expect(mockPinoLogger.warn).toHaveBeenCalledWith(context, 'Slow request detected')
    })
  })

  describe('debug()', () => {
    it('should call pino debug with message only', async () => {
      const loggerService = await createLoggerService()
      loggerService.debug('Test debug message')

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(undefined, 'Test debug message')
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1)
    })

    it('should call pino debug with message and context', async () => {
      const loggerService = await createLoggerService()
      const context = { query: 'SELECT * FROM users', executionTime: 15 }
      loggerService.debug('Database query executed', context)

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(context, 'Database query executed')
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1)
    })

    it('should call pino debug with empty context object', async () => {
      const loggerService = await createLoggerService()
      loggerService.debug('Debug message', {})

      expect(mockPinoLogger.debug).toHaveBeenCalledWith({}, 'Debug message')
    })

    it('should handle complex debugging context', async () => {
      const loggerService = await createLoggerService()
      const context = {
        request: { headers: { 'user-agent': 'test' }, body: { test: true } },
        state: { step: 3, total: 10 },
        cache: { hit: false, ttl: 60 },
      }
      loggerService.debug('Request processing', context)

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(context, 'Request processing')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null context gracefully', async () => {
      const loggerService = await createLoggerService()
      // @ts-expect-error Testing null handling
      loggerService.info('Test message', null)

      expect(mockPinoLogger.info).toHaveBeenCalledWith(null, 'Test message')
    })

    it('should handle empty string message', async () => {
      const loggerService = await createLoggerService()
      loggerService.info('')

      expect(mockPinoLogger.info).toHaveBeenCalledWith(undefined, '')
    })

    it('should handle very long messages', async () => {
      const loggerService = await createLoggerService()
      const longMessage = 'A'.repeat(10000)
      loggerService.info(longMessage)

      expect(mockPinoLogger.info).toHaveBeenCalledWith(undefined, longMessage)
    })

    it('should handle special characters in messages', async () => {
      const loggerService = await createLoggerService()
      const specialMessage = 'Test 🚀 with émojis and spëcial çharacters'
      loggerService.info(specialMessage)

      expect(mockPinoLogger.info).toHaveBeenCalledWith(undefined, specialMessage)
    })

    it('should handle context with circular references', async () => {
      const loggerService = await createLoggerService()
      const circular: any = { name: 'test' }
      circular.self = circular

      // This should not throw - pino handles circular references
      expect(() => {
        loggerService.info('Circular reference', circular)
      }).not.toThrow()

      expect(mockPinoLogger.info).toHaveBeenCalledWith(circular, 'Circular reference')
    })

    it('should handle multiple consecutive log calls', async () => {
      const loggerService = await createLoggerService()

      loggerService.info('Message 1')
      loggerService.warn('Message 2')
      loggerService.error('Message 3')
      loggerService.debug('Message 4')

      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1)
      expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1)
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1)
    })
  })

  describe('Log Levels', () => {
    it('should respect trace log level from environment', async () => {
      const pino = (await import('pino')).default
      await createLoggerService('trace')

      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'trace',
        })
      )
    })

    it('should respect warn log level from environment', async () => {
      const pino = (await import('pino')).default
      await createLoggerService('warn')

      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
        })
      )
    })

    it('should respect error log level from environment', async () => {
      const pino = (await import('pino')).default
      await createLoggerService('error')

      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
        })
      )
    })

    it('should respect silent log level from environment', async () => {
      const pino = (await import('pino')).default
      await createLoggerService('silent')

      expect(pino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'silent',
        })
      )
    })
  })

  describe('Type Safety', () => {
    it('should accept valid context types', async () => {
      const loggerService = await createLoggerService()

      // These should all be valid context types
      loggerService.info('String context', { key: 'value' })
      loggerService.info('Number context', { count: 123 })
      loggerService.info('Boolean context', { enabled: true })
      loggerService.info('Array context', { items: [1, 2, 3] })
      loggerService.info('Nested context', { user: { id: '123', name: 'John' } })
      loggerService.info('Mixed context', {
        string: 'value',
        number: 123,
        boolean: true,
        array: [1, 2],
        object: { nested: 'value' },
      })

      expect(mockPinoLogger.info).toHaveBeenCalledTimes(6)
    })

    it('should return void from all logging methods', async () => {
      const loggerService = await createLoggerService()

      const infoResult = loggerService.info('Test')
      const errorResult = loggerService.error('Test')
      const warnResult = loggerService.warn('Test')
      const debugResult = loggerService.debug('Test')

      expect(infoResult).toBeUndefined()
      expect(errorResult).toBeUndefined()
      expect(warnResult).toBeUndefined()
      expect(debugResult).toBeUndefined()
    })
  })
})
