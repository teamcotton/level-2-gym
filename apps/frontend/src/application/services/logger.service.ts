const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const

type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel]

export interface LoggerOptions {
  level?: LogLevelType
  prefix?: string
}

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
    this.level = options.level || LogLevel.INFO
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
