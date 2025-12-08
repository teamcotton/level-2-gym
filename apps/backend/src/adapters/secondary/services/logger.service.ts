import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import pino from 'pino'

export class PinoLoggerService implements LoggerPort {
  private logger: pino.Logger

  constructor() {
    const isDevelopment = EnvConfig.NODE_ENV !== 'production'

    this.logger = pino({
      level: EnvConfig.LOG_LEVEL,
      ...(isDevelopment && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }),
    })
  }

  info(message: string, context?: Record<string, any>): void {
    this.logger.info(context, message)
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.logger.error({ ...context, err: error }, message)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(context, message)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(context, message)
  }
}
