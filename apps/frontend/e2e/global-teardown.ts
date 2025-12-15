import fs from 'fs'
import path from 'path'

async function globalTeardown() {
  console.warn('🧹 Starting E2E test environment teardown...')

  try {
    // Read the test configuration
    const configPath = path.join(process.cwd(), 'e2e', '.test-db-config.json')

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
        containerId: string
        databaseUrl: string
        host: string
        port: number
      }

      console.warn(`📦 Stopping PostgreSQL container: ${config.containerId}`)

      // Container is automatically stopped and removed by Testcontainers
      // when the process exits, but we clean up the config file
      fs.unlinkSync(configPath)

      console.warn('✅ Test environment cleaned up')
    } else {
      console.warn('⚠️  No test configuration found, skipping cleanup')
    }
  } catch (error) {
    console.error('❌ Error during teardown:', error)
    // Don't throw - allow tests to complete even if cleanup fails
  }
}

export default globalTeardown
