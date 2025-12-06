import dotenv from 'dotenv'

dotenv.config()

const requiredEnvs: string[] = ['DATABASE_URL']

export class EnvConfig {
  static readonly NODE_ENV = process.env.NODE_ENV || 'development'
  static readonly DATABASE_URL = process.env.DATABASE_URL || ''

  static validate(): void {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}
