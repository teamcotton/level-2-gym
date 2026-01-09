import dotenv from 'dotenv'
import { obscured } from 'obscured'

dotenv.config()

const requiredEnvs: string[] = [
  'DATABASE_URL',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'MODEL_NAME',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'API_VERSION',
  'OAUTH_SYNC_SECRET',
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
  static readonly JWT_SECRET = process.env.JWT_SECRET
  static readonly JWT_EXPIRATION = process.env.JWT_EXPIRATION || '3600' // 1 hour in seconds
  static readonly JWT_ISSUER = process.env.JWT_ISSUER || 'my-app'
  static readonly API_VERSION = process.env.API_VERSION || 'v1'
  static readonly UPSTASH_REDIS_REST_URL = obscured.make(process.env.UPSTASH_REDIS_REST_URL)
  static readonly UPSTASH_REDIS_REST_TOKEN = obscured.make(process.env.UPSTASH_REDIS_REST_TOKEN)
  static readonly REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT || '30000'
  static readonly CONNECTION_TIMEOUT = process.env.CONNECTION_TIMEOUT || '10000'
  static readonly KEEP_ALIVE_TIMEOUT = process.env.KEEP_ALIVE_TIMEOUT || '65000'
  static readonly OAUTH_SYNC_SECRET = obscured.make(process.env.OAUTH_SYNC_SECRET)

  static validate(): void {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}
