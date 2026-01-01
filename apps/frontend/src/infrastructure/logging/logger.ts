import type { LoggerPort } from '@/application/ports/logger.port.js'

const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const

type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel]

/**
 * Configuration options for the UnifiedLogger.
 */
export interface LoggerOptions {
  /**
   * The minimum log level to output. Messages below this level will be filtered out.
   * Hierarchy: TRACE < DEBUG < INFO < WARN < ERROR
   * @default 'debug'
   */
  minLevel?: LogLevelType
  /**
   * An optional prefix to prepend to all log messages.
   * Useful for identifying the source of log messages (e.g., component name, module name).
   * @example '[AuthService]', '[UserAPI]'
   */
  prefix?: string
  /**
   * The numeric log level for compatibility purposes.
   */
  level?: number
}

/**
 * Represents a formatted log message with metadata.
 */
export interface FormattedLogMessage {
  /**
   * ISO 8601 timestamp when the log message was created.
   */
  timestamp: string
  /**
   * The prefix string for the logger instance, if configured.
   */
  prefix: string
  /**
   *
   * The log method/level in uppercase (e.g., 'DEBUG', 'INFO', 'WARN', 'ERROR').
   */
  method: string
  /**
   * The actual log message content.
   */
  message: string
  /**
   * Optional numeric log level, included only if configured in LoggerOptions.
   */
  level?: number
}

/**
 * A unified logging service that provides consistent formatting and level-based filtering
 * across the application. Supports trace, debug, info, warn, and error methods with automatic
 * timestamp and prefix formatting. Returns formatted objects instead of strings for better
 * structured logging.
 *
 * @example
 * ```typescript
 * // Create a logger with default settings (DEBUG minLevel)
 * const logger = new UnifiedLogger()
 * logger.info('Application started')
 *
 * // Create a logger with custom options
 * const logger = new UnifiedLogger({ minLevel: 'debug', prefix: 'MyComponent' })
 * logger.debug('Debug information', { userId: 123 })
 * logger.error('An error occurred', error)
 *
 * // Create a logger with numeric level for compatibility
 * const logger = new UnifiedLogger({ minLevel: 'info', level: 20 })
 * logger.info('Message') // Output includes level: 20
 *
 * // Change logging threshold dynamically
 * logger.setMinLevel('warn') // Only warn and error will log now
 * logger.getMinLevel() // Returns 'warn'
 * ```
 */
export class UnifiedLogger implements LoggerPort {
  private static readonly LOG_LEVELS = [
    LogLevel.TRACE,
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
  ]

  private minLevel: LogLevelType
  private readonly prefix: string
  private level?: number

  constructor(options: LoggerOptions = {}) {
    this.level = options.level
    this.minLevel = options.minLevel || LogLevel.DEBUG
    this.prefix = options.prefix || ''
  }

  private shouldLog(logLevel: LogLevelType): boolean {
    return (
      UnifiedLogger.LOG_LEVELS.indexOf(logLevel) >= UnifiedLogger.LOG_LEVELS.indexOf(this.minLevel)
    )
  }

  private formatMessage(
    logLevel: LogLevelType,
    message: string,
    ..._args: unknown[]
  ): FormattedLogMessage {
    const timestamp = new Date().toISOString()
    const prefixPart = this.prefix ? `[${this.prefix}] ` : ''
    const result: FormattedLogMessage = {
      timestamp: timestamp,
      prefix: prefixPart,
      method: logLevel.toUpperCase(),
      message,
    }

    if (this.level !== undefined) {
      result.level = this.level
    }

    return result
  }

  /**
   * Logs a trace-level message with optional additional arguments.
   * Trace messages are only logged in non-production environments and when the logger's
   * minLevel threshold allows trace output.
   *
   * @param message - The main log message
   * @param args - Additional arguments to log (objects, errors, etc.)
   *
   * @example
   * ```typescript
   * logger.trace('Function called', { params: { id: 123 } })
   * logger.trace('Stack trace point', stackInfo)
   * ```
   */
  trace(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.TRACE) && process.env.NODE_ENV !== 'production') {
      console.trace(this.formatMessage(LogLevel.TRACE, message), ...args)
    }
  }

  /**
   * Logs a debug-level message with optional additional arguments.
   * Debug messages are only logged in non-production environments and when the logger's
   * minLevel threshold allows debug output.
   *
   * @param message - The main log message
   * @param args - Additional arguments to log (objects, errors, etc.)
   *
   * @example
   * ```typescript
   * logger.debug('Processing item', { itemId: 456 })
   * logger.debug('Cache hit', cacheKey, value)
   * ```
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG) && process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), ...args)
    }
  }

  /**
   * Logs an info-level message with optional additional arguments.
   * Info messages are only logged in non-production environments and when the logger's
   * minLevel threshold allows info output.
   *
   * @param message - The main log message
   * @param args - Additional arguments to log (objects, errors, etc.)
   *
   * @example
   * ```typescript
   * logger.info('User logged in', { userId: '123' })
   * logger.info('API request completed', responseData)
   * ```
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO) && process.env.NODE_ENV !== 'production') {
      console.info(this.formatMessage(LogLevel.INFO, message), ...args)
    }
  }

  /**
   * Logs a warning-level message with optional additional arguments.
   * Warning messages are logged in all environments (including production) when the logger's
   * minLevel threshold allows warn output.
   *
   * @param message - The main log message
   * @param args - Additional arguments to log (objects, errors, etc.)
   *
   * @example
   * ```typescript
   * logger.warn('Deprecated API usage', { api: 'oldEndpoint' })
   * logger.warn('Rate limit approaching', currentRate, limit)
   * ```
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message), ...args)
    }
  }

  /**
   * Logs an error-level message with optional additional arguments.
   * Error messages are logged in all environments (including production) when the logger's
   * minLevel threshold allows error output.
   *
   * @param message - The main log message
   * @param args - Additional arguments to log (errors, context objects, etc.)
   *
   * @example
   * ```typescript
   * logger.error('Failed to fetch data', error)
   * logger.error('Database connection lost', { host, port }, error)
   * ```
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message), ...args)
    }
  }

  /**
   * Sets the minimum logging level threshold.
   * Messages below this threshold will be filtered out.
   *
   * @param minLevel - The new minimum logging level ('trace' | 'debug' | 'info' | 'warn' | 'error')
   *
   * @example
   * ```typescript
   * logger.setMinLevel('warn') // Only warn and error messages will be logged
   * logger.setMinLevel('debug') // Debug, info, warn, and error messages will be logged
   * ```
   */
  setMinLevel(minLevel: LogLevelType): void {
    this.minLevel = minLevel
  }

  /**
   * Returns the current minimum logging level threshold.
   *
   * @returns The current minimum level ('trace' | 'debug' | 'info' | 'warn' | 'error')
   *
   * @example
   * ```typescript
   * const currentMinLevel = logger.getMinLevel() // e.g., 'debug'
   * ```
   */
  getMinLevel(): LogLevelType {
    return this.minLevel
  }

  /**
   * Sets the optional numeric log level.
   * When set, this value will be included in the formatted log message output.
   * Useful for compatibility with logging systems that use numeric levels.
   *
   * @param level - The numeric log level
   *
   * @example
   * ```typescript
   * logger.setLevel(30) // Sets numeric level to 30
   * logger.info('Message') // Output will include level: 30
   * ```
   */
  setLevel(level: number): void {
    this.level = level
  }

  /**
   * Returns the current numeric log level if set, otherwise undefined.
   *
   * @returns The numeric level or undefined if not configured
   *
   * @example
   * ```typescript
   * const level = logger.getLevel() // e.g., 30 or undefined
   * ```
   */
  getLevel(): number | undefined {
    return this.level
  }
}

/**
 * Factory function to create a new UnifiedLogger instance.
 * Provides a convenient way to instantiate loggers without using 'new'.
 *
 * @param options - Optional configuration for the logger
 * @returns A new UnifiedLogger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({ minLevel: 'info', prefix: 'API' })
 * logger.info('Request received')
 * ```
 */
export function createLogger(options?: LoggerOptions): UnifiedLogger {
  return new UnifiedLogger(options)
}
