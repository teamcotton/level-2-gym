import dotenv from 'dotenv'
import { obscured } from 'obscured'

dotenv.config()

const requiredEnvs: string[] = ['DATABASE_URL', 'GOOGLE_GENERATIVE_AI_API_KEY', 'MODEL_PROVIDER']

export class EnvConfig {
  static readonly NODE_ENV = process.env.NODE_ENV || 'development'
  static readonly DATABASE_URL = obscured.make(process.env.DATABASE_URL)
  static readonly DATABASE_SSL_ENABLED = process.env.DATABASE_SSL_ENABLED || 'false'
  static readonly DATABASE_SSL_REJECT_UNAUTHORIZED =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'true'
  static readonly GOOGLE_GENERATIVE_AI_API_KEY = obscured.make(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  )
  static readonly MODEL_PROVIDER = process.env.MODEL_PROVIDER
  static readonly PORT = process.env.PORT || '3000'
  static readonly LOG_LEVEL = process.env.LOG_LEVEL || 'info'

  static validate(): void {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}
