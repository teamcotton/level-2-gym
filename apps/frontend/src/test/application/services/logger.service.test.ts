import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger, UnifiedLogger } from '@/application/services/logger.service.js'

describe('UnifiedLogger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('constructor', () => {
    it('should create logger with default options', () => {
      const logger = new UnifiedLogger()

      expect(logger).toBeInstanceOf(UnifiedLogger)
      expect(logger.getLevel()).toBe('debug')
    })

    it('should create logger with custom log level', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      expect(logger.getLevel()).toBe('debug')
    })

    it('should create logger with custom prefix', () => {
      const logger = new UnifiedLogger({ prefix: 'MyApp' })

      logger.info('test message')

      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[MyApp]'))
    })

    it('should create logger with both custom level and prefix', () => {
      const logger = new UnifiedLogger({ level: 'warn', prefix: 'API' })

      expect(logger.getLevel()).toBe('warn')
      logger.warn('test warning')

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[API]'))
    })
  })

  describe('debug', () => {
    it('should log debug messages when level is debug', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.debug('debug message')

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
    })

    it('should not log debug messages when level is info', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not log debug messages when level is warn', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not log debug messages when level is error', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in debug message', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.debug('test')

      const loggedMessage = consoleDebugSpy.mock.calls[0][0]
      expect(loggedMessage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log debug message with additional arguments', () => {
      const logger = new UnifiedLogger({ level: 'debug' })
      const obj = { key: 'value' }

      logger.debug('debug message', obj)

      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('debug message'), obj)
    })
  })

  describe('info', () => {
    it('should log info messages when level is debug', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.info('info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'))
    })

    it('should log info messages when level is info', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.info('info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })

    it('should not log info messages when level is warn', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should not log info messages when level is error', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in info message', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.info('test')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log info message with additional arguments', () => {
      const logger = new UnifiedLogger({ level: 'info' })
      const data = [1, 2, 3]

      logger.info('info message', data)

      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('info message'), data)
    })
  })

  describe('warn', () => {
    it('should log warn messages when level is debug', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'))
    })

    it('should log warn messages when level is info', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should log warn messages when level is warn', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should not log warn messages when level is error', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.warn('warn message')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in warn message', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.warn('test')

      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log warn message with additional arguments', () => {
      const logger = new UnifiedLogger({ level: 'warn' })
      const error = new Error('test error')

      logger.warn('warn message', error)

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('warn message'), error)
    })
  })

  describe('error', () => {
    it('should log error messages when level is debug', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'))
    })

    it('should log error messages when level is info', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should log error messages when level is warn', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should log error messages when level is error', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should include timestamp in error message', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.error('test')

      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log error message with additional arguments', () => {
      const logger = new UnifiedLogger({ level: 'error' })
      const error = new Error('critical error')
      const context = { userId: '123' }

      logger.error('error message', error, context)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('error message'),
        error,
        context
      )
    })
  })

  describe('setLevel', () => {
    it('should change log level from debug to warn', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      expect(logger.getLevel()).toBe('debug')

      logger.setLevel('warn')

      expect(logger.getLevel()).toBe('warn')
      logger.debug('should not appear')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should change log level from debug to error', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.setLevel('error')

      expect(logger.getLevel()).toBe('error')
      logger.info('should not appear')
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should allow changing level multiple times', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.setLevel('debug')
      expect(logger.getLevel()).toBe('debug')

      logger.setLevel('warn')
      expect(logger.getLevel()).toBe('warn')

      logger.setLevel('error')
      expect(logger.getLevel()).toBe('error')
    })
  })

  describe('getLevel', () => {
    it('should return current log level', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      expect(logger.getLevel()).toBe('debug')
    })

    it('should return default level when not specified', () => {
      const logger = new UnifiedLogger()

      expect(logger.getLevel()).toBe('debug')
    })
  })

  describe('message formatting', () => {
    it('should include prefix in formatted message', () => {
      const logger = new UnifiedLogger({ level: 'info', prefix: 'TestPrefix' })

      logger.info('test message')

      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[TestPrefix]'))
    })

    it('should not include prefix when not specified', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).not.toContain('[TestPrefix]')
    })

    it('should format message with correct structure', () => {
      const logger = new UnifiedLogger({ level: 'info', prefix: 'APP' })

      logger.info('test message')

      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      // Should match: timestamp [prefix] [LEVEL] message
      expect(loggedMessage).toMatch(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\[APP\] \[INFO\] test message/
      )
    })

    it('should uppercase log level in formatted message', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.debug('test')
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]')

      logger.info('test')
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]')

      logger.warn('test')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]')

      logger.error('test')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]')
    })
  })

  describe('log level hierarchy', () => {
    it('should respect log level hierarchy for debug', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for info', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for warn', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should respect log level hierarchy for error', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

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
      expect(logger.getLevel()).toBe('debug')
    })

    it('should create logger instance with options', () => {
      const logger = createLogger({ level: 'debug', prefix: 'Factory' })

      expect(logger).toBeInstanceOf(UnifiedLogger)
      expect(logger.getLevel()).toBe('debug')
    })

    it('should create independent logger instances', () => {
      const logger1 = createLogger({ level: 'debug' })
      const logger2 = createLogger({ level: 'error' })

      expect(logger1.getLevel()).toBe('debug')
      expect(logger2.getLevel()).toBe('error')

      logger1.setLevel('info')
      expect(logger1.getLevel()).toBe('info')
      expect(logger2.getLevel()).toBe('error')
    })
  })

  describe('multiple arguments', () => {
    it('should pass multiple arguments to console.debug', () => {
      const logger = new UnifiedLogger({ level: 'debug' })
      const arg1 = { key: 'value' }
      const arg2 = [1, 2, 3]
      const arg3 = 'string'

      logger.debug('message', arg1, arg2, arg3)

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('message'),
        arg1,
        arg2,
        arg3
      )
    })

    it('should pass multiple arguments to console.info', () => {
      const logger = new UnifiedLogger({ level: 'info' })
      const error = new Error('test')
      const context = { userId: '123' }

      logger.info('message', error, context)

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('message'),
        error,
        context
      )
    })

    it('should pass multiple arguments to console.warn', () => {
      const logger = new UnifiedLogger({ level: 'warn' })
      const data = { warning: true }

      logger.warn('message', data)

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('message'), data)
    })

    it('should pass multiple arguments to console.error', () => {
      const logger = new UnifiedLogger({ level: 'error' })
      const error = new Error('critical')
      const stack = error.stack

      logger.error('message', error, stack)

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('message'), error, stack)
    })
  })

  describe('production environment behavior', () => {
    let originalEnv: string | undefined

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should suppress debug messages in production', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should suppress info messages in production', () => {
      const logger = new UnifiedLogger({ level: 'info' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should allow warn messages in production', () => {
      const logger = new UnifiedLogger({ level: 'warn' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'))
    })

    it('should allow error messages in production', () => {
      const logger = new UnifiedLogger({ level: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'))
    })

    it('should suppress debug and info but allow warn and error in production', () => {
      const logger = new UnifiedLogger({ level: 'debug' })

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })
})
