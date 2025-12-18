import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger, UnifiedLogger } from '@/application/services/logger.service.js'

describe('UnifiedLogger', () => {
  let consoleTraceSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleTraceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleTraceSpy.mockRestore()
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('constructor', () => {
    it('should create logger with default options', () => {
      const logger = new UnifiedLogger()

      expect(logger).toBeInstanceOf(UnifiedLogger)
    })

    it('should create logger with custom minimum log level', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
    })

    it('should create logger with custom prefix', () => {
      const logger = new UnifiedLogger({ prefix: 'MyApp' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.prefix).toBe('[MyApp] ')
    })

    it('should create logger with both custom minimum level and prefix', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn', prefix: 'API' })

      logger.warn('test warning')

      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.prefix).toBe('[API] ')
    })
  })

  describe('trace', () => {
    it('should log trace messages when minLevel is trace', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace message')

      expect(consoleTraceSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleTraceSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('TRACE')
    })

    it('should not log trace messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should not log trace messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should not log trace messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should not log trace messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in trace message', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('test')

      const loggedMessage = consoleTraceSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log trace message with additional arguments', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })
      const obj = { key: 'value' }

      logger.trace('trace message', obj)

      const loggedMessage = consoleTraceSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('trace message')
      expect(consoleTraceSpy).toHaveBeenCalledWith(loggedMessage, obj)
    })
  })

  describe('debug', () => {
    it('should log debug messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('debug message')

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleDebugSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('DEBUG')
    })

    it('should not log debug messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not log debug messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not log debug messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in debug message', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('test')

      const loggedMessage = consoleDebugSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log debug message with additional arguments', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })
      const obj = { key: 'value' }

      logger.debug('debug message', obj)

      const loggedMessage = consoleDebugSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('debug message')
      expect(consoleDebugSpy).toHaveBeenCalledWith(loggedMessage, obj)
    })
  })

  describe('info', () => {
    it('should log info messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.info('info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('INFO')
    })

    it('should log info messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })

    it('should not log info messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should not log info messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in info message', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log info message with additional arguments', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })
      const data = [1, 2, 3]

      logger.info('info message', data)

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('info message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(loggedMessage, data)
    })
  })

  describe('warn', () => {
    it('should log warn messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('WARN')
    })

    it('should log warn messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should log warn messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should not log warn messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.warn('warn message')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in warn message', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('test')

      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log warn message with additional arguments', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })
      const error = new Error('test error')

      logger.warn('warn message', error)

      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('warn message')
      expect(consoleWarnSpy).toHaveBeenCalledWith(loggedMessage, error)
    })
  })

  describe('error', () => {
    it('should log error messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('ERROR')
    })

    it('should log error messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should log error messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should log error messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should include timestamp in error message', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('test')

      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log error message with additional arguments', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })
      const error = new Error('critical error')
      const context = { userId: '123' }

      logger.error('error message', error, context)

      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('error message')
      expect(consoleErrorSpy).toHaveBeenCalledWith(loggedMessage, error, context)
    })
  })

  describe('setMinLevel and getMinLevel', () => {
    it('should change minimum log level from debug to warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      expect(logger.getMinLevel()).toBe('debug')

      logger.setMinLevel('warn')

      expect(logger.getMinLevel()).toBe('warn')
      logger.debug('should not appear')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should change minimum log level from debug to error', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.setMinLevel('error')

      expect(logger.getMinLevel()).toBe('error')
      logger.info('should not appear')
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should allow changing minimum level multiple times', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.setMinLevel('debug')
      expect(logger.getMinLevel()).toBe('debug')

      logger.setMinLevel('warn')
      expect(logger.getMinLevel()).toBe('warn')

      logger.setMinLevel('error')
      expect(logger.getMinLevel()).toBe('error')
    })

    it('should affect logging behavior after minimum level change', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.info('should not log')
      expect(consoleInfoSpy).not.toHaveBeenCalled()

      logger.setMinLevel('info')
      logger.info('should log now')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('setLevel and getLevel', () => {
    it('should set and get numeric level', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      expect(logger.getLevel()).toBeUndefined()

      logger.setLevel(30)

      expect(logger.getLevel()).toBe(30)
    })

    it('should include level in formatted message after setLevel', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('without level')
      let loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage.level).toBeUndefined()

      logger.setLevel(40)
      logger.info('with level')
      loggedMessage = consoleInfoSpy.mock.calls[1][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.level).toBe(40)
    })

    it('should allow changing level multiple times', () => {
      const logger = new UnifiedLogger({ minLevel: 'info', level: 10 })

      expect(logger.getLevel()).toBe(10)

      logger.setLevel(20)
      expect(logger.getLevel()).toBe(20)

      logger.setLevel(30)
      expect(logger.getLevel()).toBe(30)
    })
  })

  describe('optional numeric level field', () => {
    it('should include level when provided', () => {
      const logger = new UnifiedLogger({ minLevel: 'info', level: 20 })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.level).toBe(20)
    })

    it('should not include level when not provided', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.level).toBeUndefined()
    })
  })

  describe('message formatting', () => {
    it('should include prefix in formatted message', () => {
      const logger = new UnifiedLogger({ minLevel: 'info', prefix: 'TestPrefix' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.prefix).toBe('[TestPrefix] ')
    })

    it('should not include prefix when not specified', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.prefix).toBe('')
    })

    it('should format message with correct structure', () => {
      const logger = new UnifiedLogger({ minLevel: 'info', prefix: 'APP' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(loggedMessage.prefix).toBe('[APP] ')
      expect(loggedMessage.method).toBe('INFO')
      expect(loggedMessage.message).toBe('test message')
    })

    it('should uppercase log method in formatted message', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('test')
      expect(consoleTraceSpy.mock.calls[0][0].method).toBe('TRACE')

      logger.debug('test')
      expect(consoleDebugSpy.mock.calls[0][0].method).toBe('DEBUG')

      logger.info('test')
      expect(consoleInfoSpy.mock.calls[0][0].method).toBe('INFO')

      logger.warn('test')
      expect(consoleWarnSpy.mock.calls[0][0].method).toBe('WARN')

      logger.error('test')
      expect(consoleErrorSpy.mock.calls[0][0].method).toBe('ERROR')
    })
  })

  describe('log level hierarchy', () => {
    it('should respect log level hierarchy for trace', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('createLogger factory function', () => {
    it('should create logger instance without options', () => {
      const logger = createLogger()

      expect(logger).toBeInstanceOf(UnifiedLogger)
      logger.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
    })

    it('should create logger instance with options', () => {
      const logger = createLogger({ minLevel: 'debug', prefix: 'Factory' })

      expect(logger).toBeInstanceOf(UnifiedLogger)
      logger.debug('test')
      const loggedMessage = consoleDebugSpy.mock.calls[0][0]
      expect(loggedMessage.prefix).toBe('[Factory] ')
    })

    it('should create independent logger instances', () => {
      const logger1 = createLogger({ minLevel: 'debug' })
      const logger2 = createLogger({ minLevel: 'error' })

      logger1.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)

      logger2.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1) // Should still be 1

      logger2.error('test')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('multiple arguments', () => {
    it('should pass multiple arguments to console.trace', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })
      const arg1 = { key: 'value' }
      const arg2 = [1, 2, 3]
      const arg3 = 'string'

      logger.trace('message', arg1, arg2, arg3)

      const loggedMessage = consoleTraceSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('message')
      expect(consoleTraceSpy).toHaveBeenCalledWith(loggedMessage, arg1, arg2, arg3)
    })

    it('should pass multiple arguments to console.debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })
      const arg1 = { key: 'value' }
      const arg2 = [1, 2, 3]
      const arg3 = 'string'

      logger.debug('message', arg1, arg2, arg3)

      const loggedMessage = consoleDebugSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('message')
      expect(consoleDebugSpy).toHaveBeenCalledWith(loggedMessage, arg1, arg2, arg3)
    })

    it('should pass multiple arguments to console.info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })
      const error = new Error('test')
      const context = { userId: '123' }

      logger.info('message', error, context)

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(loggedMessage, error, context)
    })

    it('should pass multiple arguments to console.warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })
      const data = { warning: true }

      logger.warn('message', data)

      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('message')
      expect(consoleWarnSpy).toHaveBeenCalledWith(loggedMessage, data)
    })

    it('should pass multiple arguments to console.error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })
      const error = new Error('critical')
      const stack = error.stack

      logger.error('message', error, stack)

      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.message).toBe('message')
      expect(consoleErrorSpy).toHaveBeenCalledWith(loggedMessage, error, stack)
    })
  })

  describe('production environment behavior', () => {
    let originalEnv: string | undefined

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV
      ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'production'
      // Clear mocks to ensure test isolation
      consoleTraceSpy.mockClear()
      consoleDebugSpy.mockClear()
      consoleInfoSpy.mockClear()
      consoleWarnSpy.mockClear()
      consoleErrorSpy.mockClear()
    })

    afterEach(() => {
      if (originalEnv === undefined) {
        delete (process.env as { NODE_ENV?: string }).NODE_ENV
      } else {
        ;(process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv
      }
    })

    it('should suppress trace messages in production', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should suppress debug messages in production', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should suppress info messages in production', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should allow warn messages in production', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('WARN')
    })

    it('should allow error messages in production', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toBeTypeOf('object')
      expect(loggedMessage.method).toBe('ERROR')
    })

    it('should suppress debug and info but allow warn and error in production', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace message')
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })
})
