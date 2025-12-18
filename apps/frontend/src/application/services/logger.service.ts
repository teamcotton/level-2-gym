const LogLevel = {
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
   * Hierarchy: DEBUG < INFO < WARN < ERROR
   * @default 'debug'
   */
  level?: LogLevelType
  /**
   * An optional prefix to prepend to all log messages.
   * Useful for identifying the source of log messages (e.g., component name, module name).
   * @example '[AuthService]', '[UserAPI]'
   */
  prefix?: string
}

/**
 * A unified logging service that provides consistent formatting and level-based filtering
 * across the application. Supports debug, info, warn, and error levels with automatic
 * timestamp and prefix formatting.
 *
 * @example
 * ```typescript
 * // Create a logger with default settings (INFO level)
 * const logger = new UnifiedLogger()
 * logger.info('Application started')
 *
 * // Create a logger with custom options
 * const logger = new UnifiedLogger({ level: 'debug', prefix: 'MyComponent' })
 * logger.debug('Debug information', { userId: 123 })
 * logger.error('An error occurred', error)
 * ```
 */
export class UnifiedLogger {
  private static readonly LOG_LEVELS = [
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
  ]

  private level: LogLevelType
  private readonly prefix: string

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || LogLevel.DEBUG
    this.prefix = options.prefix || ''
  }

  private shouldLog(level: LogLevelType): boolean {
    return UnifiedLogger.LOG_LEVELS.indexOf(level) >= UnifiedLogger.LOG_LEVELS.indexOf(this.level)
  }

  private formatMessage(level: LogLevelType, message: string, ..._args: unknown[]): string {
    const timestamp = new Date().toISOString()
    const prefixPart = this.prefix ? `[${this.prefix}] ` : ''
    return `${timestamp} ${prefixPart}[${level.toUpperCase()}] ${message}`
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG) && process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO) && process.env.NODE_ENV !== 'production') {
      console.info(this.formatMessage(LogLevel.INFO, message), ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message), ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message), ...args)
    }
  }

  setLevel(level: LogLevelType): void {
    this.level = level
  }

  getLevel(): LogLevelType {
    return this.level
  }
}

export function createLogger(options?: LoggerOptions): UnifiedLogger {
  return new UnifiedLogger(options)
}
