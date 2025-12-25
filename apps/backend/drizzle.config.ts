import { defineConfig } from 'drizzle-kit'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for drizzle-kit operations')
}

export default defineConfig({
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  schemaFilter: ['app'],
  strict: true,
  verbose: true,
})
