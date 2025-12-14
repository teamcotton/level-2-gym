import dotenv from 'dotenv'
import { obscured } from 'obscured'

dotenv.config()

const requiredEnvs: string[] = [
  'DATABASE_URL',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'MODEL_NAME',
  'RESEND_API_KEY',
]

export class EnvConfig {
  static readonly NODE_ENV = process.env.NODE_ENV || 'development'
  static readonly DATABASE_URL = obscured.make(process.env.DATABASE_URL)
  static readonly DATABASE_SSL_ENABLED = process.env.DATABASE_SSL_ENABLED || 'false'
  static readonly DATABASE_SSL_REJECT_UNAUTHORIZED =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'true'
  static readonly GOOGLE_GENERATIVE_AI_API_KEY = obscured.make(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  )
  static readonly MODEL_NAME = process.env.MODEL_NAME
  static readonly PORT = process.env.PORT || '3000'
  static readonly LOG_LEVEL = process.env.LOG_LEVEL || 'info'
  static readonly DATABASE_CONNECTION_TIMEOUT_MS =
    process.env.DATABASE_CONNECTION_TIMEOUT_MS || '5000'
  static readonly DATABASE_IDLE_TIMEOUT_MS = process.env.DATABASE_IDLE_TIMEOUT_MS || '30000'
  static readonly DATABASE_POOL_MAX = process.env.DATABASE_POOL_MAX || '20'
  static readonly DATABASE_POOL_MIN = process.env.DATABASE_POOL_MIN || '5'
  static readonly DATABASE_POOL_MAX_LIFETIME_SECONDS =
    process.env.DATABASE_POOL_MAX_LIFETIME_SECONDS || '60'
  static readonly RESEND_API_KEY = obscured.make(process.env.RESEND_API_KEY)
  static readonly EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || ''
  static readonly HOST = process.env.HOST || '127.0.0.1'
  static readonly USE_HTTPS = process.env.USE_HTTPS || 'true'

  static validate(): void {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}
