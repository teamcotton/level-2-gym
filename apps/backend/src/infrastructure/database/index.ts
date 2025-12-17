import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { obscured } from 'obscured'
import { EnvConfig } from '../config/env.config.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

if (!obscured.value(EnvConfig.DATABASE_URL)) {
  throw new ValidationException('DATABASE_URL is required but not configured')
}

export const pool = new Pool({
  connectionString: obscured.value(EnvConfig.DATABASE_URL),
  ssl:
    EnvConfig.DATABASE_SSL_ENABLED === 'true'
      ? { rejectUnauthorized: EnvConfig.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  connectionTimeoutMillis: Number.parseInt(EnvConfig.DATABASE_CONNECTION_TIMEOUT_MS),
  idleTimeoutMillis: Number.parseInt(EnvConfig.DATABASE_IDLE_TIMEOUT_MS),
  max: Number.parseInt(EnvConfig.DATABASE_POOL_MAX),
  min: Number.parseInt(EnvConfig.DATABASE_POOL_MIN),
  maxLifetimeSeconds: Number.parseInt(EnvConfig.DATABASE_POOL_MAX_LIFETIME_SECONDS),
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export const db = drizzle(pool)
