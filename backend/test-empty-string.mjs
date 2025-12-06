process.env.DATABASE_URL = ''

const { EnvConfig } = await import('./src/infrastructure/config/env.config.js')

try {
  EnvConfig.validate()
  console.log('FAIL: Should have thrown an error for empty string')
  process.exit(1)
} catch (error) {
  console.log('PASS: Correctly threw error:', error.message)
  process.exit(0)
}
