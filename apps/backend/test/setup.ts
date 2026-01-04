/**
 * Global test setup for Vitest
 *
 * Sets default environment variables required for tests to run successfully.
 * These values are used when the actual .env file is not available (e.g., in CI).
 *
 * IMPORTANT: This runs at module load time (before any imports) to ensure
 * environment variables are available when EnvConfig runs dotenv.config()
 */

// Set default environment variables for testing if not already set
// These must be set at module level (not in beforeAll) to be available
// when modules are imported, particularly when EnvConfig.ts runs dotenv.config()

// NOTE: This JWT secret is for testing only. Never use this value in production.
// Our JWT implementation requires a secret of at least 256 bits; this hardcoded
// value is intentionally longer (~512 bits) to satisfy that requirement in tests.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing-minimum-256-bits-required'
}

if (!process.env.JWT_ISSUER) {
  process.env.JWT_ISSUER = 'test-issuer'
}

if (!process.env.JWT_EXPIRATION) {
  process.env.JWT_EXPIRATION = '3600' // 1 hour in seconds for tests
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
}

if (!process.env.DATABASE_SSL_ENABLED) {
  process.env.DATABASE_SSL_ENABLED = 'false'
}

if (!process.env.DATABASE_SSL_REJECT_UNAUTHORIZED) {
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = 'false'
}

if (!process.env.DATABASE_CONNECTION_TIMEOUT_MS) {
  process.env.DATABASE_CONNECTION_TIMEOUT_MS = '5000'
}

if (!process.env.DATABASE_IDLE_TIMEOUT_MS) {
  process.env.DATABASE_IDLE_TIMEOUT_MS = '30000'
}

if (!process.env.DATABASE_POOL_MAX) {
  process.env.DATABASE_POOL_MAX = '20'
}

if (!process.env.DATABASE_POOL_MIN) {
  process.env.DATABASE_POOL_MIN = '5'
}

if (!process.env.DATABASE_POOL_MAX_LIFETIME_SECONDS) {
  process.env.DATABASE_POOL_MAX_LIFETIME_SECONDS = '60'
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-api-key'
}

if (!process.env.MODEL_NAME) {
  process.env.MODEL_NAME = 'gemini-pro'
}

if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = 'test-resend-api-key'
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}
