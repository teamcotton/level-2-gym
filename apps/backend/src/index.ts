import 'dotenv/config'
import type { FastifyServerOptions } from 'fastify'
import { buildApp } from './app.js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { PinoLoggerService } from './adapters/secondary/services/logger.service.js'

const logger = new PinoLoggerService()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// HTTPS configuration for development
const isDevelopment = process.env.NODE_ENV !== 'production'
const useHttps = isDevelopment && process.env.USE_HTTPS === 'true'

let httpsOptions: FastifyServerOptions | undefined
if (useHttps) {
  try {
    // __dirname points to src/ or dist/ directory
    // Go up one level to backend/, then into certs/
    const certsPath = join(__dirname, '..', 'certs')

    httpsOptions = {
      https: {
        key: readFileSync(join(certsPath, 'key.pem')),
        cert: readFileSync(join(certsPath, 'cert.pem')),
      },
    } as FastifyServerOptions
    logger.info('🔒 HTTPS enabled for development')
  } catch (error) {
    logger.warn('⚠️  HTTPS certificates not found, falling back to HTTP')
    logger.warn(`   Looked in: ${join(__dirname, '..', 'certs')}`)
    logger.warn('   To generate certificates with proper Subject Alternative Names:')
    logger.warn('   cd apps/backend/certs && openssl req -x509 -newkey rsa:4096 \\')
    logger.warn('     -keyout key.pem -out cert.pem -sha256 -days 365 -nodes \\')
    logger.warn('     -config openssl.cnf -extensions v3_req')
  }
}

const fastify = buildApp(httpsOptions)

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
    const host = process.env.HOST || '127.0.0.1'

    await fastify.listen({ port, host })
    const protocol = useHttps ? 'https' : 'http'
    logger.info(`Server listening on ${protocol}://${host}:${port}`)
    logger.info(`📚 API Documentation: ${protocol}://${host}:${port}/docs`)
  } catch (err) {
    logger.error('Failed to start server', err instanceof Error ? err : new Error(String(err)))
    process.exit(1)
  }
}

start()
