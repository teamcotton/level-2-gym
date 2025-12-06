import { defineConfig } from 'drizzle-kit'
import { EnvConfig } from '../config/env.config.js'

export default defineConfig({
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: EnvConfig.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
