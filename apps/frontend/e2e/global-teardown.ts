import fs from 'node:fs'
import path from 'node:path'

async function globalTeardown() {
  console.warn('🧹 Starting E2E test environment teardown...')

  try {
    // Stop backend server
    const { backendProcess } = await import('./global-setup.js')
    if (backendProcess && !backendProcess.killed && backendProcess.exitCode === null) {
      console.warn('🛑 Stopping backend server...')
      try {
        backendProcess.kill('SIGTERM')

        // Wait for graceful shutdown
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (!backendProcess.killed && backendProcess.exitCode === null) {
              console.warn('⚠️  Backend did not stop gracefully, forcing kill...')
              try {
                backendProcess.kill('SIGKILL')
              } catch (error) {
                console.warn(`⚠️  Could not force kill backend: ${error}`)
              }
            }
            resolve()
          }, 5000)

          backendProcess.on('exit', () => {
            clearTimeout(timeout)
            resolve()
          })
        })

        console.warn('✅ Backend server stopped')
      } catch (error) {
        console.warn(`⚠️  Error stopping backend server: ${error}`)
      }
    } else if (backendProcess) {
      console.warn('ℹ️  Backend process already exited or was killed')
    }

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
      console.warn('💾 Database data has been wiped (container destroyed)')
    } else {
      console.warn('⚠️  No test configuration found, skipping cleanup')
    }
  } catch (error) {
    console.error('❌ Error during teardown:', error)
    // Don't throw - allow tests to complete even if cleanup fails
  }
}

export default globalTeardown
