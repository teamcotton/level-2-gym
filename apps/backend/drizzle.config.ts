import { defineConfig } from 'drizzle-kit'
import { obscured } from 'obscured'
import { EnvConfig } from './src/infrastructure/config/env.config.js'
import { ValidationException } from './src/shared/exceptions/validation.exception.js'

const dbUrl = obscured.value(EnvConfig.DATABASE_URL)
if (!dbUrl) {
  throw new ValidationException('DATABASE_URL is required for drizzle-kit operations')
}

export default defineConfig({
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: obscured.value(EnvConfig.DATABASE_URL) || '',
  },
  strict: true,
  verbose: true,
})
